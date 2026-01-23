import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useReceiver, useSender } from "../../router/MidiControl";
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
  const { selectedOut, selectedIn, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  useEffect(() => {
    if (!selectedOut) return;

    sendThrottled(channelId, processorId, cValue, sender, selectedChannel);
    console.log(`${componentId} value changed to ${cValue}`);
  }, [cValue]);

  useEffect(() => {
    if (lastMsg?.decoded) {
      const changes = lastMsg?.decoded?.changes;

      if (!Array.isArray(changes)) return;

      for (const change of changes) {
        if (change.module === channelId) {
          if (change.param === processorId) {
            setCValue(change.value14);
          }
        }
      }
    }
  }, [lastMsg]);

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
