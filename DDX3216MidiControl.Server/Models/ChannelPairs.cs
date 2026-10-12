namespace MidiInterface.Models
{
    /// <summary>
    /// Stereo pairing of input channels: an odd channel and the next one (C1+C2, C3+C4 …), i.e.
    /// modules 0+1, 2+3 … 30+31. A pair is identified by its odd channel's module (0, 2 … 30).
    /// While paired, every change on one channel is applied to the other; pan-type parameters are
    /// mirrored (odd = left side, even = right side) so the pair keeps a symmetric stereo image.
    /// </summary>
    public static class ChannelPairs
    {
        public const int ChannelCount = 32;      // input channels 1..32 = modules 0..31
        public const int PanParam = 3;           // channel pan (0..60, 30 = centre)
        public const int BusPanParam = 8;        // bus send pan (0..60)
        public const int PanMax = 60;
        public const int PanHardLeft = 0;
        public const int PanHardRight = PanMax;

        /// <summary>Parameters that are mirrored (left/right) instead of copied.</summary>
        public static bool IsMirrored(int param) => param is PanParam or BusPanParam;

        public static bool IsChannel(int module) => module is >= 0 and < ChannelCount;

        /// <summary>Module of the odd channel of the pair the module belongs to (C1 for C1 or C2).</summary>
        public static int OddOf(int module) => module & ~1;

        /// <summary>The other channel of the pair (C1 ↔ C2).</summary>
        public static int PartnerOf(int module) => module ^ 1;

        public static double Mirror(double value) => Math.Clamp(PanMax - value, 0, PanMax);

        /// <summary>
        /// The changes the partner channels must receive for <paramref name="changes"/>.
        /// A partner change already present in the batch wins (it was set explicitly).
        /// </summary>
        public static BehringerChange[] Expand(IReadOnlyCollection<BehringerChange> changes, IReadOnlySet<int> pairedOddModules)
        {
            if (pairedOddModules.Count == 0 || changes.Count == 0) return [];

            var present = new HashSet<ModuleParamKey>(changes.Select(c => c.Key));
            var linked = new List<BehringerChange>();
            foreach (var c in changes)
            {
                if (!IsChannel(c.Module) || !pairedOddModules.Contains(OddOf(c.Module))) continue;

                var partner = new ModuleParamKey(PartnerOf(c.Module), c.Param);
                if (!present.Add(partner)) continue;

                var value = IsMirrored(c.Param) ? Mirror(c.Value) : c.Value;
                linked.Add(new BehringerChange(partner.Module, partner.Param, value));
            }
            return linked.ToArray();
        }
    }
}
