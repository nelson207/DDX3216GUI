using MidiInterface.Helpers;
using MidiInterface.Midi;
using MidiInterface.Models;
using System.Text.RegularExpressions;

namespace MidiInterface.Services
{
    /// <summary>
    /// MIDI over the ALSA sequencer (Linux / Raspberry Pi). Ports are remembered by name (persisted),
    /// so the selection survives restarts and USB re-plugs: ALSA port announcements trigger
    /// <see cref="PollDevices"/> immediately, which reconnects the saved ports when they come back.
    /// All sequencer calls that use the output client run under one lock.
    /// On other systems (e.g. Windows development) the server runs without MIDI.
    /// </summary>
    public sealed partial class MidiRouterService : IDisposable
    {
        private const string ClientName = "DDX3216 Remote";
        private const string VirtualOutputName = "Virtual output (development, no MIDI)";

        private readonly object _io = new();
        private readonly ChangeBus _bus;
        private readonly MidiSettingsStore _settingsStore;
        private readonly ILogger<MidiRouterService> _logger;
        private readonly bool _filterIncoming;
        private readonly AlsaSequencer? _seq;
        private readonly Timer _portsChangedDebounce;
        // development without ALSA (e.g. Windows): accept and discard output so the UI can be used
        private readonly bool _virtualOutput;

        private volatile List<AlsaPort> _ports = new();
        private MidiSettings _desired;
        // lock-free copies for other threads (ALSA reader thread, dispatcher)
        private volatile int _channel = 1;
        private volatile bool _outOpen;
        private AlsaPort? _out;
        private AlsaPort? _in;

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
            _portsChangedDebounce = new Timer(_ => SafePoll(), null, Timeout.Infinite, Timeout.Infinite);

            _seq = AlsaSequencer.TryCreate(ClientName, logger, out var error);
            if (_seq == null)
            {
                _logger.LogWarning("MIDI disabled: {Reason}. (Linux: install libasound2 / libasound2t64 and add the user to the 'audio' group.)", error);
                _virtualOutput = config.GetValue("Midi:VirtualOutput", false);
                if (_virtualOutput)
                {
                    _outOpen = true;
                    _logger.LogWarning("Midi:VirtualOutput is on: changes are accepted and discarded (development only)");
                }
                return;
            }
            _seq.SysExReceived += OnSysEx;
            // a plug/unplug fires several announcements: react once, shortly after the last one
            _seq.PortsChanged += () => _portsChangedDebounce.Change(300, Timeout.Infinite);
            lock (_io) _ports = Enumerate();
        }

        public int Channel => _channel;
        public bool HasOutput => _outOpen;

        // ---------------- status ----------------

        public MidiDevices GetStatus()
        {
            if (_virtualOutput)
            {
                var virtualPort = new List<MidiDeviceInfoPortName> { new(0, VirtualOutputName) };
                return new MidiDevices([], virtualPort, null, 0, _desired.Channel, null, VirtualOutputName, false, true);
            }
            lock (_io)
            {
                var ins = _ports.Where(p => p.IsInput).Select(ToDto).ToList();
                var outs = _ports.Where(p => p.IsOutput).Select(ToDto).ToList();
                return new MidiDevices(
                    ins,
                    outs,
                    _in?.Id,
                    _out?.Id,
                    _desired.Channel,
                    _desired.InName,
                    _desired.OutName,
                    _in != null,
                    _out != null);
            }
        }

        private static MidiDeviceInfoPortName ToDto(AlsaPort p) => new((uint)p.Id, p.DisplayName);

        // ---------------- selection ----------------

        public void SelectOut(int id)
        {
            AlsaPort port;
            lock (_io)
            {
                RequireSequencer();
                port = _ports.FirstOrDefault(p => p.IsOutput && p.Id == id);
                if (port == default) throw new ArgumentException($"No MIDI output port {id}. Rescan ports and try again.");
                if (_out?.Id != port.Id) ConnectOutLocked(port);
                _desired = _desired with { OutName = port.DisplayName, OutIndex = (uint)port.Id };
                _settingsStore.Save(_desired);
            }
            _logger.LogInformation("MIDI OUT selected: {Name}", port.DisplayName);
            RaiseStatusChanged();
        }

        public void SelectIn(int id)
        {
            AlsaPort port;
            lock (_io)
            {
                RequireSequencer();
                port = _ports.FirstOrDefault(p => p.IsInput && p.Id == id);
                if (port == default) throw new ArgumentException($"No MIDI input port {id}. Rescan ports and try again.");
                if (_in?.Id != port.Id) ConnectInLocked(port);
                _desired = _desired with { InName = port.DisplayName, InIndex = (uint)port.Id };
                _settingsStore.Save(_desired);
            }
            _logger.LogInformation("MIDI IN selected: {Name}", port.DisplayName);
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
            lock (_io) _ports = Enumerate();
            Reconcile();
            RaiseStatusChanged();
        }

        /// <summary>
        /// Re-enumerates ports and reconnects/forgets the selected ones to match what is plugged in.
        /// Runs on ALSA port announcements and periodically from <see cref="MidiDeviceMonitor"/>.
        /// </summary>
        public bool PollDevices()
        {
            if (_seq == null) return false;
            bool listChanged;
            lock (_io)
            {
                var fresh = Enumerate();
                listChanged = !fresh.SequenceEqual(_ports);
                if (listChanged) _ports = fresh;
            }
            bool changed = Reconcile() || listChanged;
            if (changed) RaiseStatusChanged();
            return changed;
        }

        private void SafePoll()
        {
            try { PollDevices(); }
            catch (Exception ex) { _logger.LogWarning(ex, "MIDI port refresh failed"); }
        }

        private bool Reconcile()
        {
            if (_seq == null) return false;
            bool changed = false;
            lock (_io)
            {
                // OUT: gone, re-plugged under a new address, or back after an unplug
                var outNow = FindByName(p => p.IsOutput, _out?.DisplayName ?? _desired.OutName);
                if (_out is { } current && outNow == null)
                {
                    _logger.LogWarning("MIDI OUT disconnected: {Name}", current.DisplayName);
                    _out = null; // ALSA already removed the subscription with the port
                    _outOpen = false;
                    changed = true;
                }
                else if (outNow is { } outPort && _out?.Id != outPort.Id && _desired.OutName != null)
                {
                    try
                    {
                        ConnectOutLocked(outPort);
                        _logger.LogInformation("MIDI OUT connected: {Name}", outPort.DisplayName);
                        changed = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "MIDI OUT {Name} could not be connected", outPort.DisplayName);
                    }
                }

                // IN
                var inNow = FindByName(p => p.IsInput, _in?.DisplayName ?? _desired.InName);
                if (_in is { } currentIn && inNow == null)
                {
                    _logger.LogWarning("MIDI IN disconnected: {Name}", currentIn.DisplayName);
                    _in = null;
                    changed = true;
                }
                else if (inNow is { } inPort && _in?.Id != inPort.Id && _desired.InName != null)
                {
                    try
                    {
                        ConnectInLocked(inPort);
                        _logger.LogInformation("MIDI IN connected: {Name}", inPort.DisplayName);
                        changed = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "MIDI IN {Name} could not be connected", inPort.DisplayName);
                    }
                }
            }
            return changed;
        }

        // ---------------- output ----------------

        /// <summary>Sends one SysEx message. Returns false when no output is connected or ALSA refused it.</summary>
        public bool Send(byte[] data)
        {
            if (_virtualOutput) return data.Length > 0; // discarded on purpose (development)
            if (data.Length == 0 || !_outOpen || _seq == null) return false;
            lock (_io)
            {
                if (_out == null) return false;
                try
                {
                    _seq.SendSysEx(data);
                    return true;
                }
                catch (IOException ex)
                {
                    _logger.LogWarning("MIDI OUT send failed on {Name}: {Error}", _out?.DisplayName, ex.Message);
                    return false;
                }
            }
        }

        // ---------------- input (ALSA reader thread) ----------------

        private void OnSysEx(byte[] message)
        {
            try
            {
                int? channel = _filterIncoming ? _channel : null;
                var changes = BehringerUtilities.SysExDecode(message, channel);
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

        private void ConnectOutLocked(AlsaPort port)
        {
            RequireSequencer();
            _seq!.ConnectOutput(port); // throws when ALSA refuses: the previous connection stays
            if (_out is { } old && old.Id != port.Id) _seq.DisconnectOutput(old);
            _out = port;
            _outOpen = true;
        }

        private void ConnectInLocked(AlsaPort port)
        {
            RequireSequencer();
            _seq!.ConnectInput(port);
            if (_in is { } old && old.Id != port.Id) _seq.DisconnectInput(old);
            _in = port;
        }

        private void RequireSequencer()
        {
            if (_seq == null) throw new InvalidOperationException("MIDI is not available on this system (ALSA sequencer not found).");
        }

        private List<AlsaPort> Enumerate()
        {
            if (_seq == null) return new();
            try
            {
                return _seq.ListPorts();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not enumerate MIDI ports");
                return _ports;
            }
        }

        private AlsaPort? FindByName(Func<AlsaPort, bool> kind, string? name)
        {
            if (name == null) return null;
            foreach (var p in _ports)
                if (kind(p) && SameDevice(p.DisplayName, name)) return p;
            return null;
        }

        // Names end with the ALSA client:port address ("UM-ONE:UM-ONE MIDI 1 20:0"), which can
        // change when the device is re-plugged: compare without it.
        [GeneratedRegex(@"\s+\d+:\d+$")]
        private static partial Regex AlsaAddress();

        private static string Normalize(string name) => AlsaAddress().Replace(name.Trim(), "");

        private static bool SameDevice(string a, string b) =>
            string.Equals(Normalize(a), Normalize(b), StringComparison.OrdinalIgnoreCase);

        private void RaiseStatusChanged()
        {
            try { StatusChanged?.Invoke(); }
            catch (Exception ex) { _logger.LogWarning(ex, "StatusChanged handler failed"); }
        }

        public void Dispose()
        {
            _portsChangedDebounce.Dispose();
            lock (_io)
            {
                if (_seq != null)
                {
                    if (_out is { } o) _seq.DisconnectOutput(o);
                    if (_in is { } i) _seq.DisconnectInput(i);
                }
                _out = null;
                _in = null;
                _outOpen = false;
            }
            _seq?.Dispose();
        }
    }
}
