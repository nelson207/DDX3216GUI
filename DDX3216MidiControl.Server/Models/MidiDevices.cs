using MidiInterface.Services;

namespace MidiInterface.Models
{
    public class MidiDevices
    {
        public IReadOnlyList<MidiDeviceInfoPortName> InDevices { get => MidiRouterService.ListInDevices(); }
        public IReadOnlyList<MidiDeviceInfoPortName> OutDevices { get => MidiRouterService.ListOutDevices(); }

        public int? SelectedInDevice { get; set; }
        public int? SelectedOutDevice { get; set; }
        public int Channel { get; set; }

        public MidiDevices(int? selectedInDevice, int? selectedOutDevice, int channel)
        {
            SelectedInDevice = selectedInDevice;
            SelectedOutDevice = selectedOutDevice;
            Channel = channel;
        }
    }
}
