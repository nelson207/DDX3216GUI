import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useSender } from "../../router/MidiControl";
import sendThrottled from "../../router/MidiSend";

function ParamKindRangeTile({
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
    <>
      <div>
        <input
          className="form-range  m-2 w-75 mx-auto"
          type="range"
          min={def.min ?? 0}
          max={def.max ?? 127}
          value={cValue}
          onChange={(e) => setCValue(Number(e.target.value))}
          onDoubleClick={() => setCValue(def.defaultRaw)}
          id={componentId}
          channelId={channelId}
          channelLabel={channelLabel}
          processorId={processorId}
        />
      </div>
      <output
        htmlFor={componentId}
        id={`rangeValue_${componentId}`}
        aria-hidden="true"
      >
        {def.format(cValue)}
      </output>
    </>
  );
}

export default ParamKindRangeTile;
