using MidiInterface.Helpers;
using RtMidi.Net;
using RtMidi.Net.Clients;
using RtMidi.Net.Enums;
using RtMidi.Net.Events;
using System.Text.Json;


namespace MidiInterface.Services
{
    public sealed class MidiRouterService : IDisposable
    {
        private static MidiApi _midiApi = OperatingSystem.IsLinux() ? MidiApi.LinuxAlsa : MidiApi.WindowsMultimediaMidi;
        private static List<MidiDeviceInfo> _availableDevices = new();
        private MidiOutputClient? _midiOut;
        private MidiInputClient? _midiIn;
        // RtMidi output is not thread safe: SysEx from different clients must not interleave
        private readonly SemaphoreSlim _sendLock = new(1, 1);
        private readonly object _deviceLock = new();

        public WebSocketService? WebSocketHandler { get; set; }
        private BehringerStateStoreService _behringerStateStoreService;
        public int? SelectedOutDevice { get; private set; }
        public int? SelectedInDevice { get; private set; }
        public int Channel { get; private set; } = 1;

        public MidiRouterService(BehringerStateStoreService behringerStateStoreService)
        {
            _behringerStateStoreService = behringerStateStoreService;
            _availableDevices = MidiManager.GetAvailableDevices(_midiApi);
        }

        // -------- Device listing --------
        public static IReadOnlyList<MidiDeviceInfoPortName> ListOutDevices()
        {
            List<MidiDeviceInfoPortName> returnValue = new();

            foreach (var device in _availableDevices)
            {
                if (device.Type != MidiDeviceType.Output) continue;
                returnValue.Add(new MidiDeviceInfoPortName(device.Port, device.Name));
            }

            return returnValue;
        }

        public static void RefreshDeviceList()
        {
            _availableDevices = MidiManager.GetAvailableDevices(_midiApi);
        }

        public static IReadOnlyList<MidiDeviceInfoPortName> ListInDevices()
        {
            List<MidiDeviceInfoPortName> returnValue = new();

            foreach (var device in _availableDevices)
            {
                if (device.Type != MidiDeviceType.Input) continue;
                returnValue.Add(new MidiDeviceInfoPortName(device.Port, device.Name));
            }

            return returnValue;
        }

        // -------- Select devices --------
        // Re-selecting closes the previous port first, otherwise ports leak and
        // MIDI IN handlers stack up (every console change would be broadcast twice).
        public void SelectOut(int deviceIndex)
        {
            lock (_deviceLock)
            {
                var device = MidiManager.GetDeviceInfo((uint)deviceIndex, MidiDeviceType.Output);
                var newOut = new MidiOutputClient(device);
                newOut.Open();

                var oldOut = _midiOut;
                _midiOut = newOut;
                SelectedOutDevice = deviceIndex;
                CloseQuietly(oldOut);
            }
        }

        public void SelectIn(int deviceIndex)
        {
            lock (_deviceLock)
            {
                var deviceIn = MidiManager.GetDeviceInfo((uint)deviceIndex, MidiDeviceType.Input);
                var newIn = new MidiInputClient(deviceIn);
                newIn.IgnoreSysexMessages = false;
                newIn.OnMessageReceived += OnMidiInSysexMessageReceived;
                newIn.ActivateMessageReceivedEvent();
                newIn.Open();

                var oldIn = _midiIn;
                _midiIn = newIn;
                SelectedInDevice = deviceIndex;
                if (oldIn != null)
                {
                    oldIn.OnMessageReceived -= OnMidiInSysexMessageReceived;
                    CloseQuietly(oldIn);
                }
            }
        }

        private static void CloseQuietly(MidiOutputClient? client)
        {
            if (client == null) return;
            try { client.Close(); } catch { }
            try { client.Dispose(); } catch { }
        }

        private static void CloseQuietly(MidiInputClient? client)
        {
            if (client == null) return;
            try { client.Close(); } catch { }
            try { client.Dispose(); } catch { }
        }

        // -------- Channel --------
        public void SetChannel(int channel)
        {
            if (channel is < 1 or > 16) throw new ArgumentOutOfRangeException(nameof(channel));
            Channel = channel;
        }

        // -------- Send bytes to MIDI OUT + websockets --------
        public async Task SendBytesAsync(byte[] data, CancellationToken ct)
        {
            if (data.Length == 0) return;

            var midiOut = _midiOut;
            if (midiOut == null) return;

            await _sendLock.WaitAsync(ct);
            try
            {
                await Task.Run(() => midiOut.SendMessage(data), ct);
            }
            finally
            {
                _sendLock.Release();
            }
        }

        // -------- MIDI IN -> broadcast -> remote --------
        private void OnMidiInSysexMessageReceived(object? sender, MidiMessageReceivedEventArgs e)
        {
            try
            {
                MidiMessage midiMessage = e.Message;

                if (midiMessage is MidiMessageSystemExclusive { Type: MidiMessageType.SystemExclusive } message)
                {
                    var changes = BehringerUtilities.SysExDecode(message.Data);

                    if (changes != null && WebSocketHandler != null)
                    {
                        string json = JsonSerializer.Serialize(changes);

                        _behringerStateStoreService.SetMany(changes);
                        // broadcast to local websocket clients
                        _ = WebSocketHandler.BroadcastToClientsAsync(json, null, CancellationToken.None);

                    }
                }
            }
            catch
            {

            }
        }

        public void Dispose()
        {
            _midiIn?.Close();
            _midiIn?.Dispose();
            _midiOut?.Close();
            _midiOut?.Dispose();
        }
    }

    public record MidiDeviceInfoPortName(uint Index, string Name);

}
