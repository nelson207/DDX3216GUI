using System.Text.Json.Serialization;

namespace MidiInterface.Models
{
    /// <summary>One DDX3216 parameter change: module (0..127), param (0..127), 14-bit value.</summary>
    public class BehringerChange
    {
        public const int MaxValue = 0x3FFF;

        public BehringerChange(int module, int param, double value)
        {
            Module = module;
            Param = param;
            Value = value;
        }

        // Explicit names: the web client uses PascalCase keys for changes
        [JsonPropertyName("Module")]
        public int Module { get; set; }

        [JsonPropertyName("Param")]
        public int Param { get; set; }

        [JsonPropertyName("Value")]
        public double Value { get; set; }

        [JsonIgnore]
        public ModuleParamKey Key => new(Module, Param);

        /// <summary>Range check before anything reaches the 7-bit SysEx encoder.</summary>
        public bool IsValid() =>
            Module is >= 0 and <= 0x7F &&
            Param is >= 0 and <= 0x7F &&
            double.IsFinite(Value) &&
            Value >= 0 && Value <= MaxValue;
    }
}
