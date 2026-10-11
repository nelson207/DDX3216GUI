using System.Runtime.InteropServices;

namespace MidiInterface.Midi
{
    /// <summary>P/Invoke surface of the ALSA sequencer (alsa-lib, libasound.so.2) used by <see cref="AlsaSequencer"/>.</summary>
    internal static unsafe class AlsaNative
    {
        private const string Lib = "libasound.so.2";
        private const string LibC = "libc";

        // snd_seq_open streams / mode
        public const int SND_SEQ_OPEN_OUTPUT = 1;
        public const int SND_SEQ_OPEN_INPUT = 2;
        public const int SND_SEQ_NONBLOCK = 1;

        // port capabilities
        public const uint CAP_READ = 1 << 0;
        public const uint CAP_WRITE = 1 << 1;
        public const uint CAP_SUBS_READ = 1 << 5;
        public const uint CAP_SUBS_WRITE = 1 << 6;
        public const uint CAP_NO_EXPORT = 1 << 7;

        // port types
        public const uint TYPE_MIDI_GENERIC = 1 << 1;
        public const uint TYPE_APPLICATION = 1 << 20;

        // addresses / queues
        public const byte CLIENT_SYSTEM = 0;
        public const byte PORT_SYSTEM_ANNOUNCE = 1;
        public const byte ADDRESS_SUBSCRIBERS = 254;
        public const byte ADDRESS_UNKNOWN = 253;
        public const byte QUEUE_DIRECT = 253;

        // event types
        public const byte EVENT_CLIENT_START = 60;
        public const byte EVENT_CLIENT_EXIT = 61;
        public const byte EVENT_CLIENT_CHANGE = 62;
        public const byte EVENT_PORT_START = 63;
        public const byte EVENT_PORT_EXIT = 64;
        public const byte EVENT_PORT_CHANGE = 65;
        public const byte EVENT_SYSEX = 130;

        // event flags
        public const byte EVENT_LENGTH_VARIABLE = 1 << 2;

        // snd_seq_event_t: type(1) flags(1) tag(1) queue(1) time(8) source(2) dest(2) data(12) = 28 bytes.
        // data.ext is packed { uint len; void* ptr }, so ptr sits at offset 20 (unaligned on 64-bit).
        public const int EVENT_SIZE = 28;
        public const int OFS_TYPE = 0;
        public const int OFS_FLAGS = 1;
        public const int OFS_QUEUE = 3;
        public const int OFS_SOURCE = 12;
        public const int OFS_DEST = 14;
        public const int OFS_EXT_LEN = 16;
        public const int OFS_EXT_PTR = 20;

        public const short POLLIN = 0x001;
        public const int EAGAIN = 11;
        public const int ENOSPC = 28;
        public const int EBUSY = 16;

        [StructLayout(LayoutKind.Sequential)]
        public struct SndSeqAddr
        {
            public byte Client;
            public byte Port;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct PollFd
        {
            public int Fd;
            public short Events;
            public short REvents;
        }

        // ---- sequencer ----
        [DllImport(Lib)] public static extern int snd_seq_open(out IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string name, int streams, int mode);
        [DllImport(Lib)] public static extern int snd_seq_close(IntPtr handle);
        [DllImport(Lib)] public static extern int snd_seq_set_client_name(IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string name);
        [DllImport(Lib)] public static extern int snd_seq_client_id(IntPtr handle);
        [DllImport(Lib)] public static extern int snd_seq_create_simple_port(IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string name, uint caps, uint type);

        // ---- enumeration ----
        [DllImport(Lib)] public static extern int snd_seq_client_info_malloc(out IntPtr info);
        [DllImport(Lib)] public static extern void snd_seq_client_info_free(IntPtr info);
        [DllImport(Lib)] public static extern void snd_seq_client_info_set_client(IntPtr info, int client);
        [DllImport(Lib)] public static extern int snd_seq_client_info_get_client(IntPtr info);
        [DllImport(Lib)] public static extern IntPtr snd_seq_client_info_get_name(IntPtr info);
        [DllImport(Lib)] public static extern int snd_seq_query_next_client(IntPtr handle, IntPtr info);

        [DllImport(Lib)] public static extern int snd_seq_port_info_malloc(out IntPtr info);
        [DllImport(Lib)] public static extern void snd_seq_port_info_free(IntPtr info);
        [DllImport(Lib)] public static extern void snd_seq_port_info_set_client(IntPtr info, int client);
        [DllImport(Lib)] public static extern void snd_seq_port_info_set_port(IntPtr info, int port);
        [DllImport(Lib)] public static extern int snd_seq_port_info_get_port(IntPtr info);
        [DllImport(Lib)] public static extern IntPtr snd_seq_port_info_get_name(IntPtr info);
        [DllImport(Lib)] public static extern uint snd_seq_port_info_get_capability(IntPtr info);
        [DllImport(Lib)] public static extern int snd_seq_query_next_port(IntPtr handle, IntPtr info);

        // ---- subscriptions (connections) ----
        [DllImport(Lib)] public static extern int snd_seq_port_subscribe_malloc(out IntPtr sub);
        [DllImport(Lib)] public static extern void snd_seq_port_subscribe_free(IntPtr sub);
        [DllImport(Lib)] public static extern void snd_seq_port_subscribe_set_sender(IntPtr sub, ref SndSeqAddr addr);
        [DllImport(Lib)] public static extern void snd_seq_port_subscribe_set_dest(IntPtr sub, ref SndSeqAddr addr);
        [DllImport(Lib)] public static extern int snd_seq_subscribe_port(IntPtr handle, IntPtr sub);
        [DllImport(Lib)] public static extern int snd_seq_unsubscribe_port(IntPtr handle, IntPtr sub);

        // ---- events ----
        [DllImport(Lib)] public static extern int snd_seq_event_output_direct(IntPtr handle, byte* ev);
        [DllImport(Lib)] public static extern int snd_seq_event_input(IntPtr handle, out IntPtr ev);
        [DllImport(Lib)] public static extern int snd_seq_poll_descriptors_count(IntPtr handle, short events);
        [DllImport(Lib)] public static extern int snd_seq_poll_descriptors(IntPtr handle, PollFd* pfds, uint space, short events);

        [DllImport(Lib)] public static extern IntPtr snd_strerror(int errnum);

        [DllImport(LibC, SetLastError = true)] public static extern int poll(PollFd* fds, nuint nfds, int timeout);

        public static string Error(int code) => Marshal.PtrToStringUTF8(snd_strerror(code)) ?? $"ALSA error {code}";
    }
}
