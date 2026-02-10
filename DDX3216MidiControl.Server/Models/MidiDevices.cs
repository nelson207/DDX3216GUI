using MidiInterface.Services;

namespace MidiInterface.Models
{
    public class MidiDevices
    {
<<<<<<< HEAD
        public IReadOnlyList<MidiDeviceInfoPortName> InDevices { get => MidiRouterService.ListInDevices(); }
        public IReadOnlyList<MidiDeviceInfoPortName> OutDevices { get => MidiRouterService.ListOutDevices(); }
=======
        public IReadOnlyList<MidiDeviceInfo> InDevices { get => MidiRouterService.ListInDevices(); }
        public IReadOnlyList<MidiDeviceInfo> OutDevices { get => MidiRouterService.ListOutDevices(); }
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9

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
