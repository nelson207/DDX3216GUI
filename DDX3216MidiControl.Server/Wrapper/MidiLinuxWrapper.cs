using System.Runtime.InteropServices;

namespace DDX3216MidiControl.Server.Wrapper
{
    public sealed class AlsaMidiByteStream : IDisposable
    {
        // ========= Public types =========

        public sealed record PortInfo(int Client, int Port, string ClientName, string PortName)
        {
            public override string ToString() => $"{Client}:{Port} {ClientName} - {PortName}";
        }

        // ========= Public API =========

        public IReadOnlyList<PortInfo> ListReadablePorts() => ListPorts(readable: true);
        public IReadOnlyList<PortInfo> ListWritablePorts() => ListPorts(readable: false);

        /// <summary>Open ALSA sequencer and create one local input port + one local output port.</summary>
        public void Open(string clientName = "AlsaMidiByteStream")
        {
            EnsureLinux();
            if (_seq != IntPtr.Zero) throw new InvalidOperationException("Already open.");

            int rc = snd_seq_open(out _seq, "default", SND_SEQ_OPEN_DUPLEX, 0);
            ThrowIf(rc < 0, rc, "snd_seq_open");

            rc = snd_seq_set_client_name(_seq, clientName);
            ThrowIf(rc < 0, rc, "snd_seq_set_client_name");

            // Create a local port for receiving (readable by us, writable by others)
            _localInPort = snd_seq_create_simple_port(
                _seq,
                "in",
                SND_SEQ_PORT_CAP_WRITE | SND_SEQ_PORT_CAP_SUBS_WRITE,
                SND_SEQ_PORT_TYPE_MIDI_GENERIC | SND_SEQ_PORT_TYPE_APPLICATION
            );
            ThrowIf(_localInPort < 0, _localInPort, "snd_seq_create_simple_port(in)");

            // Create a local port for sending (readable by others, writable by us)
            _localOutPort = snd_seq_create_simple_port(
                _seq,
                "out",
                SND_SEQ_PORT_CAP_READ | SND_SEQ_PORT_CAP_SUBS_READ,
                SND_SEQ_PORT_TYPE_MIDI_GENERIC | SND_SEQ_PORT_TYPE_APPLICATION
            );
            ThrowIf(_localOutPort < 0, _localOutPort, "snd_seq_create_simple_port(out)");

            // Non-blocking mode so poll loop can be clean
            snd_seq_nonblock(_seq, 1);

            // Start receive thread
            _cts = new CancellationTokenSource();
            _rxThread = new Thread(() => RxLoop(_cts.Token))
            {
                IsBackground = true,
                Name = "ALSA-MIDI-RX"
            };
            _rxThread.Start();
        }

        /// <summary>
        /// Connect a remote source (client:port) to our local input port (so we receive their MIDI).
        /// Equivalent to: aconnect remoteClient:remotePort -> ourClient:localInPort
        /// </summary>
        public void ConnectFrom(int remoteClient, int remotePort)
        {
            EnsureOpen();
            int rc = snd_seq_connect_from(_seq, _localInPort, remoteClient, remotePort);
            ThrowIf(rc < 0, rc, "snd_seq_connect_from");
        }

        /// <summary>
        /// Connect our local output port to a remote destination (client:port) (so they receive our MIDI).
        /// Equivalent to: aconnect ourClient:localOutPort -> remoteClient:remotePort
        /// </summary>
        public void ConnectTo(int remoteClient, int remotePort)
        {
            EnsureOpen();
            int rc = snd_seq_connect_to(_seq, _localOutPort, remoteClient, remotePort);
            ThrowIf(rc < 0, rc, "snd_seq_connect_to");
        }

        /// <summary>Send a single byte. If you're sending SysEx, call BeginSysEx() first.</summary>
        public void SendByte(byte b)
        {
            EnsureOpen();
            lock (_txLock)
            {
                if (_sysexMode)
                {
                    _sysexBuffer.Add(b);
                    return;
                }

                // Non-SysEx byte-by-byte: build small messages based on status byte framing.
                // This is a minimal parser; if you want full MIDI running status etc., say so.
                _midiAssembler.Add(b);
                TryFlushAsMidiEvent();
            }
        }

        /// <summary>Send a byte array. If it starts with 0xF0 and ends with 0xF7, it is sent as SysEx.</summary>
        public void SendBytes(ReadOnlySpan<byte> data)
        {
            EnsureOpen();
            lock (_txLock)
            {
                // If caller passes full SysEx, send as one ALSA SYSEX event.
                if (data.Length >= 2 && data[0] == 0xF0 && data[^1] == 0xF7)
                {
                    SendSysExEvent(data);
                    return;
                }

                // Otherwise feed byte-by-byte
                for (int i = 0; i < data.Length; i++) SendByte(data[i]);
            }
        }

        public void BeginSysEx()
        {
            EnsureOpen();
            lock (_txLock)
            {
                _sysexMode = true;
                _sysexBuffer.Clear();
            }
        }

        public void EndSysEx()
        {
            EnsureOpen();
            lock (_txLock)
            {
                if (!_sysexMode) return;
                _sysexMode = false;
                if (_sysexBuffer.Count == 0) return;
                SendSysExEvent(CollectionsMarshal.AsSpan(_sysexBuffer));
                _sysexBuffer.Clear();
            }
        }

        /// <summary>Returns true if a byte is available to read.</summary>
        public bool HasByte
        {
            get { lock (_rxLock) return _rxQueue.Count > 0; }
        }

        /// <summary>Read one byte from the receive queue; blocks up to timeoutMs. Returns null on timeout.</summary>
        public byte? ReadByte(int timeoutMs = 0)
        {
            EnsureOpen();
            var sw = timeoutMs > 0 ? System.Diagnostics.Stopwatch.StartNew() : null;

            while (true)
            {
                lock (_rxLock)
                {
                    if (_rxQueue.Count > 0) return _rxQueue.Dequeue();
                }

                if (timeoutMs == 0) return null;
                if (sw!.ElapsedMilliseconds >= timeoutMs) return null;
                Thread.Sleep(1);
            }
        }

        /// <summary>Drain up to max bytes immediately (no block). Returns number copied.</summary>
        public int ReadBytes(Span<byte> dest)
        {
            EnsureOpen();
            int n = 0;
            lock (_rxLock)
            {
                while (n < dest.Length && _rxQueue.Count > 0)
                {
                    dest[n++] = _rxQueue.Dequeue();
                }
            }
            return n;
        }

        public void Dispose()
        {
            try
            {
                _cts?.Cancel();
                _rxThread?.Join(200);
            }
            catch { /* ignore */ }

            if (_seq != IntPtr.Zero)
            {
                snd_seq_close(_seq);
                _seq = IntPtr.Zero;
            }

            _cts?.Dispose();
            _cts = null;
        }

        // ========= Internals =========

        private IntPtr _seq = IntPtr.Zero;
        private int _localInPort = -1;
        private int _localOutPort = -1;

        private readonly object _rxLock = new();
        private readonly Queue<byte> _rxQueue = new(8192);

        private readonly object _txLock = new();
        private readonly List<byte> _sysexBuffer = new(4096);
        private bool _sysexMode;

        // Minimal message assembler (non-SysEx). For SysEx we send as SYSEX event.
        private readonly List<byte> _midiAssembler = new(8);
        private byte _runningStatus = 0;

        private CancellationTokenSource? _cts;
        private Thread? _rxThread;

        private void EnsureOpen()
        {
            if (_seq == IntPtr.Zero) throw new InvalidOperationException("Call Open() first.");
        }

        private static void EnsureLinux()
        {
            if (!RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                throw new PlatformNotSupportedException("This wrapper is Linux-only (ALSA).");
        }

        private IReadOnlyList<PortInfo> ListPorts(bool readable)
        {
            EnsureLinux();
            IntPtr seq;
            int rc = snd_seq_open(out seq, "default", SND_SEQ_OPEN_DUPLEX, 0);
            ThrowIf(rc < 0, rc, "snd_seq_open (list)");

            try
            {
                // Allocate client+port info structs
                IntPtr cinfo, pinfo;
                snd_seq_client_info_malloc(out cinfo);
                snd_seq_port_info_malloc(out pinfo);
                try
                {
                    snd_seq_client_info_set_client(cinfo, -1);

                    var list = new List<PortInfo>();
                    while (snd_seq_query_next_client(seq, cinfo) >= 0)
                    {
                        int client = snd_seq_client_info_get_client(cinfo);
                        string clientName = PtrToStringUTF8(snd_seq_client_info_get_name(cinfo)) ?? $"client{client}";

                        snd_seq_port_info_set_client(pinfo, client);
                        snd_seq_port_info_set_port(pinfo, -1);

                        while (snd_seq_query_next_port(seq, pinfo) >= 0)
                        {
                            int port = snd_seq_port_info_get_port(pinfo);
                            int caps = snd_seq_port_info_get_capability(pinfo);

                            // readable=true means "we can read from it" => remote has WRITE capability
                            // writable=false means "we can write to it" => remote has READ capability
                            bool ok = readable
                                ? (caps & SND_SEQ_PORT_CAP_READ) != 0 || (caps & SND_SEQ_PORT_CAP_SUBS_READ) != 0 // they can be read by others
                                : (caps & SND_SEQ_PORT_CAP_WRITE) != 0 || (caps & SND_SEQ_PORT_CAP_SUBS_WRITE) != 0;

                            // The above is conservative; ALSA caps naming is confusing. Practically:
                            // - Sources typically have CAP_READ/SUBS_READ (others can read from them)
                            // - Destinations typically have CAP_WRITE/SUBS_WRITE (others can write to them)
                            // We'll keep it simple and not over-filter; you can filter by name in app.

                            string portName = PtrToStringUTF8(snd_seq_port_info_get_name(pinfo)) ?? $"port{port}";
                            if (ok)
                                list.Add(new PortInfo(client, port, clientName, portName));
                        }
                    }
                    return list;
                }
                finally
                {
                    snd_seq_port_info_free(pinfo);
                    snd_seq_client_info_free(cinfo);
                }
            }
            finally
            {
                snd_seq_close(seq);
            }
        }

        private void RxLoop(CancellationToken ct)
        {
            // We use snd_seq_event_input in a loop; nonblock means it returns -EAGAIN when no events.
            while (!ct.IsCancellationRequested)
            {
                int rc = snd_seq_event_input(_seq, out IntPtr evPtr);
                if (rc >= 0 && evPtr != IntPtr.Zero)
                {
                    try
                    {
                        var ev = Marshal.PtrToStructure<snd_seq_event_t>(evPtr);
                        HandleIncomingEvent(ev);
                    }
                    catch
                    {
                        // swallow to keep thread alive; your service should log if desired
                    }
                }
                else
                {
                    Thread.Sleep(1);
                }
            }
        }

        private unsafe void HandleIncomingEvent(snd_seq_event_t ev)
        {
            // Most MIDI arrives as NOTEON/CONTROLLER etc; SysEx arrives as SYSEX with pointer+len.
            // We enqueue a simple raw MIDI stream:
            // - For non-sysex events: we reconstruct into standard MIDI bytes.
            // - For sysex: enqueue the payload bytes as-is (should include F0..F7 from sender).
            // If your device sends sysex without framing, tell me and we’ll frame it.

            if (ev.type == SND_SEQ_EVENT_SYSEX)
            {
                int len = ev.data.ext.len;
                if (len > 0 && ev.data.ext.ptr != IntPtr.Zero)
                {
                    byte* p = (byte*)ev.data.ext.ptr.ToPointer();
                    lock (_rxLock)
                    {
                        for (int i = 0; i < len; i++) _rxQueue.Enqueue(p[i]);
                    }
                }
                return;
            }

            Span<byte> msg = stackalloc byte[3];
            int n = 0;

            // Minimal mapping for the common channel events.
            // Expand if you need more ALSA event types.
            switch (ev.type)
            {
                case SND_SEQ_EVENT_NOTEON:
                    msg[0] = (byte)(0x90 | (ev.data.note.channel & 0x0F));
                    msg[1] = (byte)(ev.data.note.note & 0x7F);
                    msg[2] = (byte)(ev.data.note.velocity & 0x7F);
                    n = 3;
                    break;

                case SND_SEQ_EVENT_NOTEOFF:
                    msg[0] = (byte)(0x80 | (ev.data.note.channel & 0x0F));
                    msg[1] = (byte)(ev.data.note.note & 0x7F);
                    msg[2] = (byte)(ev.data.note.velocity & 0x7F);
                    n = 3;
                    break;

                case SND_SEQ_EVENT_CONTROLLER:
                    msg[0] = (byte)(0xB0 | (ev.data.control.channel & 0x0F));
                    msg[1] = (byte)(ev.data.control.param & 0x7F);
                    msg[2] = (byte)(ev.data.control.value & 0x7F);
                    n = 3;
                    break;

                case SND_SEQ_EVENT_PGMCHANGE:
                    msg[0] = (byte)(0xC0 | (ev.data.control.channel & 0x0F));
                    msg[1] = (byte)(ev.data.control.value & 0x7F);
                    n = 2;
                    break;

                case SND_SEQ_EVENT_CHANPRESS:
                    msg[0] = (byte)(0xD0 | (ev.data.control.channel & 0x0F));
                    msg[1] = (byte)(ev.data.control.value & 0x7F);
                    n = 2;
                    break;

                case SND_SEQ_EVENT_PITCHBEND:
                    {
                        // ALSA value is signed, center=0. MIDI is 14-bit unsigned with center=8192.
                        int v = ev.data.control.value + 8192;
                        if (v < 0) v = 0;
                        if (v > 16383) v = 16383;
                        msg[0] = (byte)(0xE0 | (ev.data.control.channel & 0x0F));
                        msg[1] = (byte)(v & 0x7F);
                        msg[2] = (byte)((v >> 7) & 0x7F);
                        n = 3;
                        break;
                    }

                default:
                    // ignore unhandled event types for now
                    return;
            }

            lock (_rxLock)
            {
                for (int i = 0; i < n; i++) _rxQueue.Enqueue(msg[i]);
            }
        }

        private void TryFlushAsMidiEvent()
        {
            // Minimal state machine:
            // - If status byte encountered, store running status.
            // - Determine expected data length for common channel messages.
            // - When enough bytes collected, send as ALSA event.

            if (_midiAssembler.Count == 0) return;

            byte b0 = _midiAssembler[0];

            // Handle running status
            if (b0 < 0x80)
            {
                if (_runningStatus == 0) { _midiAssembler.Clear(); return; }
                _midiAssembler.Insert(0, _runningStatus);
                b0 = _midiAssembler[0];
            }
            else
            {
                if (b0 < 0xF0) _runningStatus = b0;
            }

            if (b0 == 0xF0)
            {
                // If user wants "byte-by-byte SysEx without BeginSysEx/EndSysEx",
                // we can detect it and switch. For now, require BeginSysEx().
                return;
            }

            int needed = NeededBytesForStatus(b0);
            if (needed == 0)
            {
                // Unsupported message -> drop
                _midiAssembler.Clear();
                return;
            }

            if (_midiAssembler.Count < needed) return;

            // Send assembled message as ALSA event
            Span<byte> msg = stackalloc byte[3];
            msg[0] = _midiAssembler[0];
            msg[1] = needed > 1 ? _midiAssembler[1] : (byte)0;
            msg[2] = needed > 2 ? _midiAssembler[2] : (byte)0;

            SendShortMidiEvent(msg.Slice(0, needed));

            // Remove sent bytes, keep any extra (unlikely)
            _midiAssembler.RemoveRange(0, needed);
        }

        private static int NeededBytesForStatus(byte status)
        {
            // Channel voice messages
            if (status >= 0x80 && status <= 0xEF)
            {
                int hi = status & 0xF0;
                return hi switch
                {
                    0xC0 => 2,
                    0xD0 => 2,
                    _ => 3,
                };
            }

            // System common/realtime (not fully supported here)
            // You can extend as needed.
            return 0;
        }

        private void SendShortMidiEvent(ReadOnlySpan<byte> msg)
        {
            // Convert MIDI bytes to ALSA sequencer events for common channel messages
            // (NoteOn/Off/CC/PC/Pressure/Pitchbend). Others can be added.

            byte status = msg[0];
            if (status < 0x80 || status >= 0xF0) return;

            int ch = status & 0x0F;
            int type = status & 0xF0;

            snd_seq_event_t ev = default;
            snd_seq_ev_clear(ref ev);
            snd_seq_ev_set_source(ref ev, _localOutPort);
            snd_seq_ev_set_subs(ref ev);
            snd_seq_ev_set_direct(ref ev);

            switch (type)
            {
                case 0x80:
                    ev.type = SND_SEQ_EVENT_NOTEOFF;
                    ev.data.note.channel = (byte)ch;
                    ev.data.note.note = msg[1];
                    ev.data.note.velocity = msg[2];
                    break;

                case 0x90:
                    ev.type = SND_SEQ_EVENT_NOTEON;
                    ev.data.note.channel = (byte)ch;
                    ev.data.note.note = msg[1];
                    ev.data.note.velocity = msg[2];
                    break;

                case 0xB0:
                    ev.type = SND_SEQ_EVENT_CONTROLLER;
                    ev.data.control.channel = (byte)ch;
                    ev.data.control.param = msg[1];
                    ev.data.control.value = msg[2];
                    break;

                case 0xC0:
                    ev.type = SND_SEQ_EVENT_PGMCHANGE;
                    ev.data.control.channel = (byte)ch;
                    ev.data.control.value = msg[1];
                    break;

                case 0xD0:
                    ev.type = SND_SEQ_EVENT_CHANPRESS;
                    ev.data.control.channel = (byte)ch;
                    ev.data.control.value = msg[1];
                    break;

                case 0xE0:
                    {
                        int lsb = msg[1] & 0x7F;
                        int msb = msg[2] & 0x7F;
                        int v = (msb << 7) | lsb; // 0..16383
                        ev.type = SND_SEQ_EVENT_PITCHBEND;
                        ev.data.control.channel = (byte)ch;
                        ev.data.control.value = v - 8192; // ALSA signed
                        break;
                    }

                default:
                    return;
            }

            int rc = snd_seq_event_output_direct(_seq, ref ev);
            ThrowIf(rc < 0, rc, "snd_seq_event_output_direct(short)");
        }

        private void SendSysExEvent(ReadOnlySpan<byte> sysex)
        {
            // ALSA needs a pointer to the data; we pin the managed array temporarily.
            byte[] arr = sysex.ToArray();

            snd_seq_event_t ev = default;
            snd_seq_ev_clear(ref ev);
            snd_seq_ev_set_source(ref ev, _localOutPort);
            snd_seq_ev_set_subs(ref ev);
            snd_seq_ev_set_direct(ref ev);

            ev.type = SND_SEQ_EVENT_SYSEX;

            var handle = GCHandle.Alloc(arr, GCHandleType.Pinned);
            try
            {
                ev.data.ext.len = arr.Length;
                ev.data.ext.ptr = handle.AddrOfPinnedObject();

                int rc = snd_seq_event_output_direct(_seq, ref ev);
                ThrowIf(rc < 0, rc, "snd_seq_event_output_direct(sysex)");
            }
            finally
            {
                handle.Free();
            }
        }

        private static string? PtrToStringUTF8(IntPtr p)
        {
            if (p == IntPtr.Zero) return null;
            // ALSA returns const char* in current locale; UTF-8 is typically fine on Pi.
            return Marshal.PtrToStringAnsi(p);
        }

        private static void ThrowIf(bool cond, int alsaRc, string where)
        {
            if (!cond) return;
            IntPtr p = snd_strerror(alsaRc);
            string msg = PtrToStaticString(p) ?? $"ALSA error {alsaRc}";
            throw new InvalidOperationException($"{where}: {msg}");
        }

        private static string? PtrToStaticString(IntPtr p) => p == IntPtr.Zero ? null : Marshal.PtrToStringAnsi(p);

        // ========= ALSA P/Invoke =========

        private const string ALSA = "libasound.so.2";

        private const int SND_SEQ_OPEN_DUPLEX = 3;

        private const int SND_SEQ_PORT_CAP_READ = 0x01;
        private const int SND_SEQ_PORT_CAP_WRITE = 0x02;
        private const int SND_SEQ_PORT_CAP_SUBS_READ = 0x20;
        private const int SND_SEQ_PORT_CAP_SUBS_WRITE = 0x40;

        private const int SND_SEQ_PORT_TYPE_MIDI_GENERIC = 0x02;
        private const int SND_SEQ_PORT_TYPE_APPLICATION = 0x100;

        // Event types (subset)
        private const ushort SND_SEQ_EVENT_NOTEOFF = 0x08;
        private const ushort SND_SEQ_EVENT_NOTEON = 0x09;
        private const ushort SND_SEQ_EVENT_CONTROLLER = 0x0A;
        private const ushort SND_SEQ_EVENT_PGMCHANGE = 0x0B;
        private const ushort SND_SEQ_EVENT_CHANPRESS = 0x0C;
        private const ushort SND_SEQ_EVENT_PITCHBEND = 0x0D;
        private const ushort SND_SEQ_EVENT_SYSEX = 0xF0;

        [DllImport(ALSA)]
        private static extern int snd_seq_open(out IntPtr handle, string name, int streams, int mode);

        [DllImport(ALSA)]
        private static extern int snd_seq_close(IntPtr handle);

        [DllImport(ALSA)]
        private static extern int snd_seq_set_client_name(IntPtr handle, string name);

        [DllImport(ALSA)]
        private static extern int snd_seq_nonblock(IntPtr handle, int nonblock);

        [DllImport(ALSA)]
        private static extern int snd_seq_create_simple_port(IntPtr handle, string name, int caps, int type);

        [DllImport(ALSA)]
        private static extern int snd_seq_connect_from(IntPtr handle, int myPort, int srcClient, int srcPort);

        [DllImport(ALSA)]
        private static extern int snd_seq_connect_to(IntPtr handle, int myPort, int destClient, int destPort);

        [DllImport(ALSA)]
        private static extern int snd_seq_event_input(IntPtr handle, out IntPtr ev);

        [DllImport(ALSA)]
        private static extern int snd_seq_event_output_direct(IntPtr handle, ref snd_seq_event_t ev);

        [DllImport(ALSA)]
        private static extern IntPtr snd_strerror(int errnum);

        // --- query clients/ports ---
        [DllImport(ALSA)]
        private static extern void snd_seq_client_info_malloc(out IntPtr ptr);

        [DllImport(ALSA)]
        private static extern void snd_seq_client_info_free(IntPtr ptr);

        [DllImport(ALSA)]
        private static extern void snd_seq_port_info_malloc(out IntPtr ptr);

        [DllImport(ALSA)]
        private static extern void snd_seq_port_info_free(IntPtr ptr);

        [DllImport(ALSA)]
        private static extern void snd_seq_client_info_set_client(IntPtr info, int client);

        [DllImport(ALSA)]
        private static extern int snd_seq_query_next_client(IntPtr handle, IntPtr info);

        [DllImport(ALSA)]
        private static extern int snd_seq_client_info_get_client(IntPtr info);

        [DllImport(ALSA)]
        private static extern IntPtr snd_seq_client_info_get_name(IntPtr info);

        [DllImport(ALSA)]
        private static extern void snd_seq_port_info_set_client(IntPtr info, int client);

        [DllImport(ALSA)]
        private static extern void snd_seq_port_info_set_port(IntPtr info, int port);

        [DllImport(ALSA)]
        private static extern int snd_seq_query_next_port(IntPtr handle, IntPtr info);

        [DllImport(ALSA)]
        private static extern int snd_seq_port_info_get_port(IntPtr info);

        [DllImport(ALSA)]
        private static extern IntPtr snd_seq_port_info_get_name(IntPtr info);

        [DllImport(ALSA)]
        private static extern int snd_seq_port_info_get_capability(IntPtr info);

        // --- event helper functions (macros in C; implemented as small externs) ---
        // These exist as functions in libasound; if your distro lacks them, tell me and I’ll inline equivalents.
        [DllImport(ALSA)]
        private static extern void snd_seq_ev_clear(ref snd_seq_event_t ev);

        [DllImport(ALSA)]
        private static extern void snd_seq_ev_set_source(ref snd_seq_event_t ev, int port);

        [DllImport(ALSA)]
        private static extern void snd_seq_ev_set_subs(ref snd_seq_event_t ev);

        [DllImport(ALSA)]
        private static extern void snd_seq_ev_set_direct(ref snd_seq_event_t ev);

        // ========= ALSA structs =========

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_addr_t
        {
            public byte client;
            public byte port;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_timestamp_t
        {
            public uint tick;
            public uint time; // unused here
        }

        // union variants - keep layout large enough; this is a common trick for ALSA seq.
        [StructLayout(LayoutKind.Explicit)]
        private struct snd_seq_event_data_t
        {
            [FieldOffset(0)] public snd_seq_ev_note_t note;
            [FieldOffset(0)] public snd_seq_ev_ctrl_t control;
            [FieldOffset(0)] public snd_seq_ev_ext_t ext;
            // other variants ignored
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_ev_note_t
        {
            public byte channel;
            public byte note;
            public byte velocity;
            public byte off_velocity;
            public uint duration;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_ev_ctrl_t
        {
            public byte channel;
            public byte unused1;
            public ushort unused2;
            public uint param;
            public int value;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_ev_ext_t
        {
            public int len;
            public IntPtr ptr;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct snd_seq_event_t
        {
            public ushort type;
            public byte flags;
            public byte tag;

            public snd_seq_timestamp_t time;

            public snd_seq_addr_t source;
            public snd_seq_addr_t dest;

            public snd_seq_event_data_t data;
        }
    }
}
