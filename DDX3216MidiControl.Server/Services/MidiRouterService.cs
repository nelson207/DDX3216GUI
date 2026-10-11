using MidiInterface.Helpers;
using MidiInterface.Models;
using RtMidi.Net;
using RtMidi.Net.Clients;
using RtMidi.Net.Enums;
using RtMidi.Net.Events;
using System.Text.RegularExpressions;

namespace MidiInterface.Services
{
    /// <summary>
    /// Owns the RtMidi ports. Ports are remembered by name (persisted), so the selection survives
    /// restarts, rescans and USB re-plugs; <see cref="Reconcile"/> reopens them when they come back.
    /// Every port operation and send runs under one lock, so a port is never closed mid-send.
    /// </summary>
    public sealed partial class MidiRouterService : IDisposable
    {
        private readonly MidiApi _api = OperatingSystem.IsLinux() ? MidiApi.LinuxAlsa : MidiApi.WindowsMultimediaMidi;
        private readonly object _io = new();
        private readonly ChangeBus _bus;
        private readonly MidiSettingsStore _settingsStore;
        private readonly ILogger<MidiRouterService> _logger;
        private readonly bool _filterIncoming;

        private volatile List<MidiDeviceInfo> _devices = new();
        private MidiSettings _desired;
        // lock-free copy for the RtMidi input thread (taking _io there could deadlock with CloseIn)
        private volatile int _channel = 1;
        // lock-free "is an output open" for the dispatcher: _io is held during (slow) sends
        private volatile bool _outOpen;
        // an open port must be missing from this many polls in a row before it is closed
        // (a single enumeration can transiently miss a busy device)
        private const int MissingPollsBeforeClose = 2;
        private int _outMissingPolls;
        private int _inMissingPolls;
        private MidiOutputClient? _out;
        private string? _outName;
        private uint? _outPort; // index of the open (or last open) port: fallback when names are unreadable
        private MidiInputClient? _in;
        private string? _inName;
        private uint? _inPort;

        /// <summary>Raised (outside the lock) when ports, selection, connection state or channel change.</summary>
        public event Action? StatusChanged;

        public MidiRouterService(ChangeBus bus, MidiSettingsStore settingsStore, IConfiguration config, ILogger<MidiRouterService> logger)
        {
            _bus = bus;
            _settingsStore = settingsStore;
            _logger = logger;
            _filterIncoming = config.GetValue("Midi:FilterIncomingChannel", true);
            _desired = settingsStore.Load();
            _channel = Math.Clamp(_desired.Channel, 1, 16);
            _outPort = _desired.OutIndex;
            _inPort = _desired.InIndex;
            _devices = Enumerate();
        }

        public int Channel => _channel;
        public bool HasOutput => _outOpen;

        // ---------------- status ----------------

        public MidiDevices GetStatus()
        {
            lock (_io)
            {
                var ins = Ports(MidiDeviceType.Input);
                var outs = Ports(MidiDeviceType.Output);
                return new MidiDevices(
                    ins,
                    outs,
                    _in != null ? (int?)Find(ins, _inName, _inPort)?.Index : null,
                    _out != null ? (int?)Find(outs, _outName, _outPort)?.Index : null,
                    _desired.Channel,
                    _desired.InName,
                    _desired.OutName,
                    _in != null,
                    _out != null);
            }
        }

        // ---------------- selection ----------------

        public void SelectOut(int index)
        {
            lock (_io)
            {
                var port = FindPort(MidiDeviceType.Output, index);
                if (_out == null || _outPort != port.Index) OpenOutLocked(port.Index, port.Name);
                _desired = _desired with { OutName = port.Name, OutIndex = port.Index };
                _settingsStore.Save(_desired);
            }
            _logger.LogInformation("MIDI OUT selected: {Name}", _outName);
            RaiseStatusChanged();
        }

        public void SelectIn(int index)
        {
            lock (_io)
            {
                var port = FindPort(MidiDeviceType.Input, index);
                if (_in == null || _inPort != port.Index) OpenInLocked(port.Index, port.Name);
                _desired = _desired with { InName = port.Name, InIndex = port.Index };
                _settingsStore.Save(_desired);
            }
            _logger.LogInformation("MIDI IN selected: {Name}", _inName);
            RaiseStatusChanged();
        }

        public void SetChannel(int channel)
        {
            if (channel is < 1 or > 16) throw new ArgumentOutOfRangeException(nameof(channel), "MIDI channel must be 1..16");
            lock (_io)
            {
                if (_desired.Channel == channel) return;
                _desired = _desired with { Channel = channel };
                _channel = channel;
                _settingsStore.Save(_desired);
            }
            RaiseStatusChanged();
        }

        public void RefreshDevices()
        {
            _devices = Enumerate();
            Reconcile();
            RaiseStatusChanged();
        }

        /// <summary>
        /// Re-enumerates ports and closes/reopens the selected ones to match what is plugged in.
        /// Called periodically by <see cref="MidiDeviceMonitor"/>. Returns true when something changed.
        /// </summary>
        public bool PollDevices()
        {
            var fresh = Enumerate();
            bool listChanged = !SameNames(fresh, _devices);
            if (listChanged) _devices = fresh;
            bool changed = Reconcile() || listChanged;
            if (changed) RaiseStatusChanged();
            return changed;
        }

        private bool Reconcile()
        {
            bool changed = false;
            lock (_io)
            {
                // OUT
                _outMissingPolls = _out != null && FindByName(MidiDeviceType.Output, _outName, _outPort) == null ? _outMissingPolls + 1 : 0;
                if (_outMissingPolls >= MissingPollsBeforeClose)
                {
                    _outMissingPolls = 0;
                    _logger.LogWarning("MIDI OUT disconnected: {Name}", _outName);
                    CloseQuietly(_out);
                    _out = null;
                    _outOpen = false;
                    changed = true;
                }
                if (_out == null && _desired.OutName != null && FindByName(MidiDeviceType.Output, _desired.OutName, _outPort) is { } outPort)
                {
                    try
                    {
                        OpenOutLocked(outPort.Index, outPort.Name);
                        _logger.LogInformation("MIDI OUT opened: {Name}", outPort.Name);
                        changed = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "MIDI OUT {Name} not available yet", outPort.Name);
                    }
                }

                // IN
                _inMissingPolls = _in != null && FindByName(MidiDeviceType.Input, _inName, _inPort) == null ? _inMissingPolls + 1 : 0;
                if (_inMissingPolls >= MissingPollsBeforeClose && _in != null)
                {
                    _inMissingPolls = 0;
                    _logger.LogWarning("MIDI IN disconnected: {Name}", _inName);
                    CloseIn(_in);
                    _in = null;
                    changed = true;
                }
                if (_in == null && _desired.InName != null && FindByName(MidiDeviceType.Input, _desired.InName, _inPort) is { } inPort)
                {
                    try
                    {
                        OpenInLocked(inPort.Index, inPort.Name);
                        _logger.LogInformation("MIDI IN opened: {Name}", inPort.Name);
                        changed = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "MIDI IN {Name} not available yet", inPort.Name);
                    }
                }
            }
            return changed;
        }

        // ---------------- output ----------------

        /// <summary>Sends one SysEx message. Returns false when no port is open or the send failed.</summary>
        public bool Send(byte[] data)
        {
            if (data.Length == 0) return false;
            bool faulted = false;
            lock (_io)
            {
                if (_out == null) return false;
                try
                {
                    _out.SendMessage(data);
                    return true;
                }
                catch (Exception ex)
                {
                    // device probably unplugged: close it, the monitor reopens it when it is back
                    _logger.LogWarning(ex, "MIDI OUT send failed on {Name}; closing port", _outName);
                    CloseQuietly(_out);
                    _out = null;
                    _outOpen = false;
                    faulted = true;
                }
            }
            if (faulted) RaiseStatusChanged();
            return false;
        }

        // ---------------- input (RtMidi thread) ----------------

        private void OnMidiInMessage(object? sender, MidiMessageReceivedEventArgs e)
        {
            try
            {
                if (e.Message is not MidiMessageSystemExclusive { Type: MidiMessageType.SystemExclusive } message)
                    return;

                int? channel = _filterIncoming ? Channel : null;
                var changes = BehringerUtilities.SysExDecode(message.Data, channel);
                if (changes == null) return;

                var valid = changes.Where(c => c.IsValid()).ToArray();
                if (valid.Length > 0) _bus.Publish(valid, ChangeSource.Midi);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to handle incoming MIDI message");
            }
        }

        // ---------------- helpers (call with _io held) ----------------

        private void OpenOutLocked(uint port, string name)
        {
            var info = MidiManager.GetDeviceInfo(port, MidiDeviceType.Output, _api);
            var client = new MidiOutputClient(info);
            try
            {
                client.Open();
            }
            catch
            {
                CloseQuietly(client);
                throw;
            }
            var old = _out;
            _out = client;
            _outName = name;
            _outPort = port;
            _outOpen = true;
            CloseQuietly(old);
        }

        private void OpenInLocked(uint port, string name)
        {
            var info = MidiManager.GetDeviceInfo(port, MidiDeviceType.Input, _api);
            var client = new MidiInputClient(info) { IgnoreSysexMessages = false };
            client.OnMessageReceived += OnMidiInMessage;
            try
            {
                client.ActivateMessageReceivedEvent();
                client.Open();
            }
            catch
            {
                CloseIn(client);
                throw;
            }
            var old = _in;
            _in = client;
            _inName = name;
            _inPort = port;
            if (old != null) CloseIn(old);
        }

        private void CloseIn(MidiInputClient client)
        {
            client.OnMessageReceived -= OnMidiInMessage;
            try { client.DeactivateMessageReceivedEvent(); } catch { }
            CloseQuietly(client);
        }

        private static void CloseQuietly(MidiClient? client)
        {
            if (client == null) return;
            try { client.Close(); } catch { }
            try { client.Dispose(); } catch { }
        }

        private List<MidiDeviceInfo> Enumerate()
        {
            try
            {
                return MidiManager.GetAvailableDevices(_api);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not enumerate MIDI devices");
                return _devices;
            }
        }

        private IReadOnlyList<MidiDeviceInfoPortName> Ports(MidiDeviceType type) =>
            _devices.Where(d => d.Type == type).Select(d => new MidiDeviceInfoPortName(d.Port, d.Name)).ToList();

        private MidiDeviceInfoPortName FindPort(MidiDeviceType type, int index) =>
            Ports(type).FirstOrDefault(p => p.Index == index)
            ?? throw new ArgumentException($"No MIDI {(type == MidiDeviceType.Input ? "input" : "output")} port {index}. Rescan ports and try again.");

        private MidiDeviceInfoPortName? FindByName(MidiDeviceType type, string? name, uint? lastIndex) =>
            Find(Ports(type), name, lastIndex);

        /// <summary>
        /// Port with the same (normalized) name. Some drivers report unreadable names (RtMidi.Net
        /// on Windows returns garbage that changes between enumerations): when either name is
        /// unreadable, fall back to the port at the last known index.
        /// </summary>
        private static MidiDeviceInfoPortName? Find(IReadOnlyList<MidiDeviceInfoPortName> ports, string? name, uint? lastIndex)
        {
            if (name == null) return null;
            var byName = ports.FirstOrDefault(p => !IsUnreadable(p.Name) && SameDevice(p.Name, name));
            if (byName != null || lastIndex == null) return byName;
            var atIndex = ports.FirstOrDefault(p => p.Index == lastIndex);
            return atIndex != null && (IsUnreadable(atIndex.Name) || IsUnreadable(name)) ? atIndex : null;
        }

        private static bool IsUnreadable(string name) =>
            string.IsNullOrWhiteSpace(name) || name.Any(ch => ch == '�' || char.IsControl(ch));

        // ALSA names end with the client:port address ("UM-ONE:UM-ONE MIDI 1 20:0"), which can
        // change when the device is re-plugged: compare without it.
        [GeneratedRegex(@"\s+\d+:\d+$")]
        private static partial Regex AlsaAddress();

        private static string Normalize(string name) => AlsaAddress().Replace(name.Trim(), "");

        private static bool SameDevice(string a, string b) =>
            string.Equals(Normalize(a), Normalize(b), StringComparison.OrdinalIgnoreCase);

        private static bool SameNames(List<MidiDeviceInfo> a, List<MidiDeviceInfo> b) =>
            a.Count == b.Count && a.Zip(b).All(x => x.First.Type == x.Second.Type && x.First.Name == x.Second.Name && x.First.Port == x.Second.Port);

        private void RaiseStatusChanged()
        {
            try { StatusChanged?.Invoke(); }
            catch (Exception ex) { _logger.LogWarning(ex, "StatusChanged handler failed"); }
        }

        public void Dispose()
        {
            lock (_io)
            {
                if (_in != null) CloseIn(_in);
                CloseQuietly(_out);
                _in = null;
                _out = null;
                _outOpen = false;
            }
        }
    }
}
