import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useReceiver, useSender } from "../../router/MidiControl";
import sendThrottled from "../../router/MidiSend";

function ParamKindRangeTile({
  def,
  value,
  componentid,
  channelid,
  channellabel,
  processorid,
}) {
  const [cValue, setCValue] = useState(value);
  const { selectedOut, selectedIn, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  useEffect(() => {
    if (!selectedOut) return;

    sendThrottled(channelid, processorid, cValue, sender, selectedChannel);
  }, [cValue]);

  useEffect(() => {
    if (lastMsg?.decoded) {
      const changes = lastMsg?.decoded?.changes;

      if (!Array.isArray(changes)) return;

      for (const change of changes) {
        if (change.module === channelid) {
          if (change.param === processorid) {
            setCValue(change.value14);
          }
        }
      }
    }
  }, [lastMsg]);

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
          id={componentid}
          channelid={channelid}
          channellabel={channellabel}
          processorid={processorid}
        />
      </div>
      <output
        htmlFor={componentid}
        id={`rangeValue_${componentid}`}
        aria-hidden="true"
      >
        {def.format(cValue)}
      </output>
    </>
  );
}

export default ParamKindRangeTile;
