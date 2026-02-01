namespace MidiInterface.Models
{
    public class BehringerChange
    {
        public BehringerChange(int module, int param, double value)
        {
            Module = module;
            Param = param;
            Value = value;
        }

        public int Module { get; set; }
        public int Param { get; set; }
        public double Value { get; set; }
    }
}
