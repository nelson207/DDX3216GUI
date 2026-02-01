import { useSelector } from "react-redux";
import { useMidi } from "./MidiControl";

export function useSelectedMidi() {
  const { inputs, outputs } = useMidi();
  const selectedInId = useSelector((s) => s.midi.selectedMidiDeviceIn);
  const selectedOutId = useSelector((s) => s.midi.selectedMidiDeviceOut);
  const selectedChannel = useSelector((s) => s.midi.selectedMidiChannel);

  const selectedIn = inputs.find((d) => d.id === selectedInId) ?? null;
  const selectedOut = outputs.find((d) => d.id === selectedOutId) ?? null;

  return { inputs, outputs, selectedIn, selectedOut, selectedChannel };
}
