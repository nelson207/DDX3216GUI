import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useSender } from "../../router/MidiControl";
import sendThrottled from "../../router/MidiSend";

function ParamKindEnumTile({
  def,
  value,
  componentId,
  channelId,
  channelLabel,
  processorId,
}) {
  const [cValue, setCValue] = useState(value);
  const { selectedOut, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);

  useEffect(() => {
    if (!selectedOut) return;

    sendThrottled(channelId, processorId, cValue, sender, selectedChannel);
    console.log(`${componentId} value changed to ${cValue}`);
  }, [cValue]);

  return (
    <select
      className="form-select m-2 w-75  text-center bg-dark text-light mx-auto"
      value={cValue}
      onChange={(e) => setCValue(e.target.checked)}
      id={componentId}
      channelId={channelId}
      channelLabel={channelLabel}
      processorId={processorId}
    >
      {(def.values ?? []).map((v) => (
        <option key={v} value={v}>
          {def.labels?.[v] ?? v}
        </option>
      ))}
    </select>
  );
}

export default ParamKindEnumTile;
