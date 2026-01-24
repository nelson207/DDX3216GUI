import { buildParamChange, packIC, to14Bit } from "./MidiControl";

export default function sendThrottled(
  channelId,
  processorId,
  value,
  sender,
  selectedChannel,
) {
  // You MUST decide how channel maps to module/param for your mixer.
  // Example placeholders:
  const module = channelId; // adjust if needed: channelIndex - 1
  const value14 = value;
  const changes = [{ module, param: processorId, value14 }];
  const ic = packIC({ midiChannel: selectedChannel, ignoreFlags: 0 });
  const apparatusId = 11;
  const bytes = buildParamChange({ ic, apparatusId, changes });

  sender.send(bytes);
}
