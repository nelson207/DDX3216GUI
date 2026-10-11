using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using static MidiInterface.Midi.AlsaNative;

namespace MidiInterface.Midi
{
    /// <summary>A sequencer port of another client (a USB MIDI interface, "Midi Through", …).</summary>
    public readonly record struct AlsaPort(int Client, int Port, string ClientName, string PortName, bool IsInput, bool IsOutput)
    {
        /// <summary>Stable numeric id used by the REST API: client * 256 + port.</summary>
        public int Id => Client * 256 + Port;

        /// <summary>Same format RtMidi used on ALSA, so saved selections keep matching.</summary>
        public string DisplayName => $"{ClientName}:{PortName} {Client}:{Port}";
    }

    /// <summary>
    /// ALSA sequencer access through alsa-lib.
    /// Two sequencer clients are used because alsa-lib handles are not safe across threads:
    ///  - "out": enumeration, (un)subscribing and sending SysEx; callers serialise access (MidiRouterService._io)
    ///  - "in": only read by a dedicated thread; receives SysEx from connected inputs and the
    ///    system announce port (port start/exit -> <see cref="PortsChanged"/>, i.e. USB plug/unplug)
    /// </summary>
    public sealed unsafe class AlsaSequencer : IDisposable
    {
        private const int MaxSysEx = 64 * 1024;

        private readonly ILogger _logger;
        private IntPtr _out;
        private IntPtr _in;
        private readonly int _outClient;
        private readonly int _outPort;
        private readonly int _inClient;
        private readonly int _inPort;
        private readonly Thread _reader;
        private volatile bool _stopping;
        private readonly List<byte> _sysex = new();

        /// <summary>Complete SysEx message (F0 … F7) from a connected input. Raised on the reader thread.</summary>
        public event Action<byte[]>? SysExReceived;

        /// <summary>Ports/clients appeared or disappeared (USB plug/unplug). Raised on the reader thread.</summary>
        public event Action? PortsChanged;

        private AlsaSequencer(string clientName, ILogger logger)
        {
            _logger = logger;
            try
            {
                (_outClient, _outPort, _inClient, _inPort) = Open(clientName);
            }
            catch
            {
                CloseHandles(); // don't leak a half-opened sequencer
                throw;
            }

            _reader = new Thread(ReadLoop) { IsBackground = true, Name = "alsa-seq-in" };
            _reader.Start();
            _logger.LogInformation("ALSA sequencer ready: out {OutClient}:{OutPort}, in {InClient}:{InPort}", _outClient, _outPort, _inClient, _inPort);
        }

        private (int outClient, int outPort, int inClient, int inPort) Open(string clientName)
        {

            Check(snd_seq_open(out _out, "default", SND_SEQ_OPEN_OUTPUT, 0), "open sequencer (output)");
            snd_seq_set_client_name(_out, clientName);
            int outClient = snd_seq_client_id(_out);
            int outPort = Check(snd_seq_create_simple_port(_out, "out", CAP_READ | CAP_SUBS_READ, TYPE_MIDI_GENERIC | TYPE_APPLICATION), "create output port");

            Check(snd_seq_open(out _in, "default", SND_SEQ_OPEN_INPUT, SND_SEQ_NONBLOCK), "open sequencer (input)");
            snd_seq_set_client_name(_in, clientName + " In");
            int inClient = snd_seq_client_id(_in);
            int inPort = Check(snd_seq_create_simple_port(_in, "in", CAP_WRITE | CAP_SUBS_WRITE, TYPE_MIDI_GENERIC | TYPE_APPLICATION), "create input port");

            // port start/exit announcements -> hot-plug without polling
            Subscribe(Addr(CLIENT_SYSTEM, PORT_SYSTEM_ANNOUNCE), Addr(inClient, inPort), "announce");
            return (outClient, outPort, inClient, inPort);
        }

        /// <summary>Opens the sequencer; returns null (with a reason) when ALSA isn't available (e.g. not Linux).</summary>
        public static AlsaSequencer? TryCreate(string clientName, ILogger logger, out string? error)
        {
            error = null;
            if (!OperatingSystem.IsLinux())
            {
                error = "ALSA is only available on Linux";
                return null;
            }
            try
            {
                return new AlsaSequencer(clientName, logger);
            }
            catch (Exception ex) when (ex is DllNotFoundException or EntryPointNotFoundException or IOException)
            {
                error = ex.Message;
                return null;
            }
        }

        // ---------------- enumeration ----------------

        /// <summary>Ports of other clients that can be connected (excludes our own clients and the system client).</summary>
        public List<AlsaPort> ListPorts()
        {
            var result = new List<AlsaPort>();
            Check(snd_seq_client_info_malloc(out var cinfo), "allocate client info");
            Check(snd_seq_port_info_malloc(out var pinfo), "allocate port info");
            try
            {
                snd_seq_client_info_set_client(cinfo, -1);
                while (snd_seq_query_next_client(_out, cinfo) >= 0)
                {
                    int client = snd_seq_client_info_get_client(cinfo);
                    if (client == CLIENT_SYSTEM || client == _outClient || client == _inClient) continue;
                    var clientName = Marshal.PtrToStringUTF8(snd_seq_client_info_get_name(cinfo)) ?? $"Client {client}";

                    snd_seq_port_info_set_client(pinfo, client);
                    snd_seq_port_info_set_port(pinfo, -1);
                    while (snd_seq_query_next_port(_out, pinfo) >= 0)
                    {
                        uint caps = snd_seq_port_info_get_capability(pinfo);
                        if ((caps & CAP_NO_EXPORT) != 0) continue;
                        bool input = (caps & (CAP_READ | CAP_SUBS_READ)) == (CAP_READ | CAP_SUBS_READ);
                        bool output = (caps & (CAP_WRITE | CAP_SUBS_WRITE)) == (CAP_WRITE | CAP_SUBS_WRITE);
                        if (!input && !output) continue;
                        int port = snd_seq_port_info_get_port(pinfo);
                        var portName = Marshal.PtrToStringUTF8(snd_seq_port_info_get_name(pinfo)) ?? $"Port {port}";
                        result.Add(new AlsaPort(client, port, clientName, portName, input, output));
                    }
                }
            }
            finally
            {
                snd_seq_port_info_free(pinfo);
                snd_seq_client_info_free(cinfo);
            }
            return result;
        }

        // ---------------- connections ----------------

        public void ConnectOutput(AlsaPort device) => Subscribe(Addr(_outClient, _outPort), Addr(device.Client, device.Port), "output");
        public void DisconnectOutput(AlsaPort device) => Unsubscribe(Addr(_outClient, _outPort), Addr(device.Client, device.Port));
        public void ConnectInput(AlsaPort device) => Subscribe(Addr(device.Client, device.Port), Addr(_inClient, _inPort), "input");
        public void DisconnectInput(AlsaPort device) => Unsubscribe(Addr(device.Client, device.Port), Addr(_inClient, _inPort));

        private void Subscribe(SndSeqAddr sender, SndSeqAddr dest, string what)
        {
            Check(snd_seq_port_subscribe_malloc(out var sub), "allocate subscription");
            try
            {
                snd_seq_port_subscribe_set_sender(sub, ref sender);
                snd_seq_port_subscribe_set_dest(sub, ref dest);
                int rc = snd_seq_subscribe_port(_out, sub);
                if (rc < 0 && rc != -EBUSY) // EBUSY: already connected
                    throw new IOException($"Could not connect {what} {sender.Client}:{sender.Port} -> {dest.Client}:{dest.Port}: {Error(rc)}");
            }
            finally
            {
                snd_seq_port_subscribe_free(sub);
            }
        }

        private void Unsubscribe(SndSeqAddr sender, SndSeqAddr dest)
        {
            if (snd_seq_port_subscribe_malloc(out var sub) < 0) return;
            try
            {
                snd_seq_port_subscribe_set_sender(sub, ref sender);
                snd_seq_port_subscribe_set_dest(sub, ref dest);
                snd_seq_unsubscribe_port(_out, sub); // fails harmlessly if the port is already gone
            }
            finally
            {
                snd_seq_port_subscribe_free(sub);
            }
        }

        // ---------------- output ----------------

        /// <summary>Sends one SysEx message (F0 … F7) to every connected output, immediately (no queue).</summary>
        public void SendSysEx(ReadOnlySpan<byte> message)
        {
            byte* ev = stackalloc byte[EVENT_SIZE];
            new Span<byte>(ev, EVENT_SIZE).Clear();
            ev[OFS_TYPE] = EVENT_SYSEX;
            ev[OFS_FLAGS] = EVENT_LENGTH_VARIABLE;
            ev[OFS_QUEUE] = QUEUE_DIRECT;
            ev[OFS_SOURCE] = (byte)_outClient;
            ev[OFS_SOURCE + 1] = (byte)_outPort;
            ev[OFS_DEST] = ADDRESS_SUBSCRIBERS;
            ev[OFS_DEST + 1] = ADDRESS_UNKNOWN;

            fixed (byte* data = message)
            {
                Unsafe.WriteUnaligned(ev + OFS_EXT_LEN, (uint)message.Length);
                Unsafe.WriteUnaligned(ev + OFS_EXT_PTR, (IntPtr)data);
                int rc = snd_seq_event_output_direct(_out, ev);
                if (rc < 0) throw new IOException($"ALSA send failed: {Error(rc)}");
            }
        }

        // ---------------- input (reader thread) ----------------

        private void ReadLoop()
        {
            int count = snd_seq_poll_descriptors_count(_in, POLLIN);
            var fds = new PollFd[Math.Max(1, count)];
            fixed (PollFd* pfds = fds)
            {
                snd_seq_poll_descriptors(_in, pfds, (uint)fds.Length, POLLIN);
                while (!_stopping)
                {
                    int ready = poll(pfds, (nuint)fds.Length, 250); // timeout: lets Dispose stop the thread
                    if (ready <= 0) continue;

                    while (!_stopping)
                    {
                        int rc = snd_seq_event_input(_in, out var ev);
                        if (rc == -EAGAIN) break; // drained
                        if (rc == -ENOSPC)
                        {
                            _logger.LogWarning("ALSA input overrun: some incoming MIDI was lost");
                            _sysex.Clear();
                            continue;
                        }
                        if (rc < 0)
                        {
                            _logger.LogWarning("ALSA input error: {Error}", Error(rc));
                            break;
                        }
                        try
                        {
                            Handle((byte*)ev);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to handle ALSA event");
                        }
                    }
                }
            }
        }

        private void Handle(byte* ev)
        {
            switch (ev[OFS_TYPE])
            {
                case EVENT_SYSEX:
                    uint len = Unsafe.ReadUnaligned<uint>(ev + OFS_EXT_LEN);
                    var ptr = Unsafe.ReadUnaligned<IntPtr>(ev + OFS_EXT_PTR);
                    if (len > 0 && ptr != IntPtr.Zero) AppendSysEx(new ReadOnlySpan<byte>((void*)ptr, (int)len));
                    break;

                case EVENT_CLIENT_START:
                case EVENT_CLIENT_EXIT:
                case EVENT_CLIENT_CHANGE:
                case EVENT_PORT_START:
                case EVENT_PORT_EXIT:
                case EVENT_PORT_CHANGE:
                    PortsChanged?.Invoke();
                    break;
            }
        }

        // ALSA may deliver one SysEx in several chunks: assemble F0 … F7
        private void AppendSysEx(ReadOnlySpan<byte> chunk)
        {
            if (chunk[0] == 0xF0) _sysex.Clear();
            if (_sysex.Count + chunk.Length > MaxSysEx)
            {
                _sysex.Clear();
                return;
            }
            foreach (var b in chunk) _sysex.Add(b);
            if (_sysex.Count > 0 && _sysex[0] == 0xF0 && _sysex[^1] == 0xF7)
            {
                var message = _sysex.ToArray();
                _sysex.Clear();
                SysExReceived?.Invoke(message);
            }
        }

        // ---------------- helpers ----------------

        private static SndSeqAddr Addr(int client, int port) => new() { Client = (byte)client, Port = (byte)port };

        private static int Check(int rc, string what)
        {
            if (rc < 0) throw new IOException($"ALSA: could not {what}: {Error(rc)}");
            return rc;
        }

        private void CloseHandles()
        {
            if (_in != IntPtr.Zero) { snd_seq_close(_in); _in = IntPtr.Zero; }
            if (_out != IntPtr.Zero) { snd_seq_close(_out); _out = IntPtr.Zero; }
        }

        public void Dispose()
        {
            _stopping = true;
            if (_reader?.IsAlive == true) _reader.Join(TimeSpan.FromSeconds(1));
            CloseHandles();
        }
    }
}
