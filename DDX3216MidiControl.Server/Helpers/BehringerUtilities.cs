using MidiInterface.Models;
using MidiInterface.Services;

namespace MidiInterface.Helpers
{
    public static class BehringerUtilities
    {
        private static byte[] MFR_ID = [0x00, 0x20, 0x32]; // Behringer manufacturer ID
        private static byte DEFAULT_APPARATUS_ID = 0x0b; // DDX3216 "device type"

        public static bool IsBehringerDDXSysEx(byte[] data)
        {
            // data is Uint8Array
            return 
              data?.Count() >= 6 &&
              data[0] == 0xf0 &&
              data[1] == 0x00 &&
              data[2] == 0x20 &&
              data[3] == 0x32
            ;
        }

        public static byte[] To14Bit(double value)
        {
            // Match JavaScript Math.round (away from zero)
            int v = (int)Math.Round(value, MidpointRounding.AwayFromZero);

            // Clamp to 14-bit range (0x0000–0x3FFF)
            v = Math.Clamp(v, 0, 0x3FFF);

            return new byte[]
            {
                (byte)(v >> 7 & 0x7F),
                (byte)(v & 0x7F)
            };
        }

        public static int From14Bit(byte hi, byte lo)
        {
            return (hi & 0x7F) << 7 | lo & 0x7F;
        }

        public static string ToHex(byte[] bytes)
        {
            return string.Join(" ", bytes.Select(b => b.ToString("X2")));
        }

        public static byte[] BuildHeader(byte ic)
        {
            var result = new byte[1 + MFR_ID.Length + 2];

            int i = 0;
            result[i++] = 0xF0;

            Array.Copy(MFR_ID, 0, result, i, MFR_ID.Length);
            i += MFR_ID.Length;

            result[i++] = (byte)(ic & 0x7F);
            result[i] = (byte)(DEFAULT_APPARATUS_ID & 0x7F);

            return result;
        }

        public static byte[] EndSysEx(byte[] bytes)
        {
            if (bytes == null || bytes.Length == 0 || bytes[0] != 0xF0)
                throw new ArgumentException("SysEx must start with F0");

            var result = new byte[bytes.Length + 1];
            Array.Copy(bytes, result, bytes.Length);
            result[^1] = 0xF7;

            return result;
        }

        public static byte PackIC(int midiChannel = 1, int ignoreFlags = 0)
        {
            // ic: high nibble = flags, low nibble = MIDI channel - 1
            // Flags A/B: ignore app ID / ignore MIDI channel (omni)

            int ch = Math.Clamp(midiChannel - 1, 0, 15);
            int flags = ignoreFlags & 0xF0; // allow raw high nibble

            return (byte)((flags | ch) & 0x7F);
        }

        public static byte[] SysExEncode(BehringerChange[] changes, MidiRouterService router)
        {
            if (changes != null)
            {
                byte[] header = BuildHeader(PackIC(router.Channel));
                int nn = Math.Clamp(changes?.Length ?? 0, 1, 23);

                // body = [0x20, nn]
                // payload: nn * (module, param, value14 hi, value14 lo)
                var data = new byte[header.Length + 2 + nn * 4];

                int idx = 0;

                // copy header
                Array.Copy(header, 0, data, idx, header.Length);
                idx += header.Length;

                // body
                data[idx++] = 0x20;
                data[idx++] = (byte)nn;

                foreach(BehringerChange change in changes)
                {
                    var hilo = To14Bit(change.Value);

                    data[idx++] = (byte)(change.Module & 0x7F);
                    data[idx++] = (byte)(change.Param & 0x7F);
                    data[idx++] = hilo[0];
                    data[idx++] = hilo[1];
                }

                // endSysEx: validate starts with 0xF0, append 0xF7
                return EndSysEx(data);
            }
            throw new ArgumentNullException();
        }

        public static BehringerChange[]? SysExDecode(byte[] data)
        {
            if (!IsBehringerDDXSysEx(data)) return null;
            if (data.Length < 9) return null;                 // must at least have header+func+nn+F7
            if (data[^1] != 0xF7) return null;

            byte ic = data[4];
            byte apparatusId = data[5];
            byte func = data[6];
            int nn = data[7];

            if ((func & 0x3F) != 0x20) return null;

            int idx = 8;
            int needed = idx + nn * 4 + 1;                  
            if (nn <= 0 || nn > 23) return null;              
            if (data.Length < needed) return null;

            var changes = new List<BehringerChange>(nn);

            for (int i = 0; i < nn; i++)
            {
                int module = data[idx++] & 0x7F;
                int param = data[idx++] & 0x7F;
                byte hi = data[idx++];
                byte lo = data[idx++];

                int value = From14Bit(hi, lo);
                changes.Add(new BehringerChange(module, param, value));
            }

            return changes.ToArray();
        }
    }
}