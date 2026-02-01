using MidiInterface.Helpers;
using NAudio.Midi;
using System.Text.Json;


namespace MidiInterface.Services
{
    public sealed class MidiRouterService : IDisposable
    {
        private MidiOut? _midiOut;
        private MidiIn? _midiIn;

        private int _bufferSize = 8192;
        private int _numBuffers = 32;

        public WebSocketService? WebSocketHandler { get; set; }
        private BehringerStateStoreService _behringerStateStoreService;
        public int? SelectedOutDevice { get; private set; }
        public int? SelectedInDevice { get; private set; }
        public int Channel { get; private set; } = 1;
        

        public MidiRouterService(BehringerStateStoreService behringerStateStoreService)
        {
            _behringerStateStoreService = behringerStateStoreService;
        }

        // -------- Device listing --------
        public static IReadOnlyList<MidiDeviceInfo> ListOutDevices()
            => Enumerable.Range(0, MidiOut.NumberOfDevices)
                .Select(i => new MidiDeviceInfo(i, MidiOut.DeviceInfo(i).ProductName))
                .ToList();

        public static IReadOnlyList<MidiDeviceInfo> ListInDevices()
            => Enumerable.Range(0, MidiIn.NumberOfDevices)
                .Select(i => new MidiDeviceInfo(i, MidiIn.DeviceInfo(i).ProductName))
                .ToList();

        // -------- Select devices --------
        public void SelectOut(int deviceIndex)
        {
            if (deviceIndex < 0 || deviceIndex >= MidiOut.NumberOfDevices)
                throw new ArgumentOutOfRangeException(nameof(deviceIndex));

            _midiOut?.Dispose();
            _midiOut = new MidiOut(deviceIndex);
            SelectedOutDevice = deviceIndex;
        }

        public void SelectIn(int deviceIndex)
        {
            if (deviceIndex < 0 || deviceIndex >= MidiIn.NumberOfDevices)
                throw new ArgumentOutOfRangeException(nameof(deviceIndex));

            if (_midiIn != null)
            {
                _midiIn.SysexMessageReceived -= OnMidiInSysexMessageReceived;
                _midiIn.ErrorReceived -= OnMidiInError;
                _midiIn.Stop();
                _midiIn.Dispose();
            }

            _midiIn = new MidiIn(deviceIndex);
            _midiIn.CreateSysexBuffers(_bufferSize, _numBuffers);
            _midiIn.SysexMessageReceived += OnMidiInSysexMessageReceived;
            _midiIn.ErrorReceived += OnMidiInError;
            _midiIn.Start();

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
                _midiOut.SendBuffer(data);
            }
        }

        // -------- MIDI IN -> broadcast -> remote --------
        private async void OnMidiInSysexMessageReceived(object? sender, MidiInSysexMessageEventArgs e)
        {
            try
            {
                byte[] data = e.SysexBytes;

                var changes = BehringerUtilities.SysExDecode(data);

                if (changes != null && WebSocketHandler != null)
                {
                    string json = JsonSerializer.Serialize(changes);
                    // broadcast to local websocket clients
                    await WebSocketHandler.BroadcastToClientsAsync(json, null,  CancellationToken.None);
                    _behringerStateStoreService.SetMany(changes);
                }
            }
            catch
            {

            }
        }

        private void OnMidiInError(object? sender, MidiInMessageEventArgs e)
        {

        }

        public void Dispose()
        {
            _midiIn?.Stop();
            _midiIn?.Dispose();
            _midiOut?.Dispose();
        }
    }

    public record MidiDeviceInfo(int Index, string Name);

}
