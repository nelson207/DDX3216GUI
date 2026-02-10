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
        private static MidiApi _midiApi = MidiApi.LinuxAlsa;
        private static List<MidiDeviceInfo> _availableDevices = MidiManager.GetAvailableDevices(_midiApi);
        private MidiOutputClient? _midiOut;
        private MidiInputClient? _midiIn;      

        public WebSocketService? WebSocketHandler { get; set; }
        private BehringerStateStoreService _behringerStateStoreService;
        public int? SelectedOutDevice { get; private set; }
        public int? SelectedInDevice { get; private set; }
        public int Channel { get; private set; } = 1;


        public MidiRouterService(BehringerStateStoreService behringerStateStoreService)
        {
            _behringerStateStoreService = behringerStateStoreService;
            _midiApi = OperatingSystem.IsLinux() ? MidiApi.LinuxAlsa : MidiApi.WindowsMultimediaMidi;
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
        public void SelectOut(int deviceIndex)
        {
            var device = MidiManager.GetDeviceInfo((uint)deviceIndex, MidiDeviceType.Output);
            _midiOut = new MidiOutputClient(device);
            _midiOut.Open();
            SelectedOutDevice = deviceIndex;
        }

        public void SelectIn(int deviceIndex)
        {
            var deviceIn = MidiManager.GetDeviceInfo((uint)deviceIndex, MidiDeviceType.Input);
            _midiIn = new MidiInputClient(deviceIn);
            _midiIn.IgnoreSysexMessages = false;
            _midiIn.OnMessageReceived += OnMidiInSysexMessageReceived;
            _midiIn.ActivateMessageReceivedEvent();
            _midiIn.Open();
            SelectedInDevice = deviceIndex;
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

            if (_midiOut != null)
            {
                await Task.Run(() => _midiOut.SendMessage(data), ct);
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
