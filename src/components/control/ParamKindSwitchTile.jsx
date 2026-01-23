import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useSender } from "../../router/MidiControl";
import sendThrottled from "../../router/MidiSend";

function ParamKindSwitchTile({
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
      <input
        type="checkbox"
        className="btn-check"
        checked={cValue}
        onChange={(e) => setCValue(e.target.checked)}
        id={componentId}
        channelId={channelId}
        channelLabel={channelLabel}
        processorId={processorId}
      />
      <label
        className={`btn m-2 w-75 text-truncate ${cValue ? def.classSelected : "btn-outline-light"}`}
        htmlFor={componentId}
      >
        {def.format(cValue)}
      </label>
    </>
  );
}

export default ParamKindSwitchTile;
