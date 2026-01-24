import { useEffect, useState } from "react";
import { useSelectedMidi } from "../../router/MidiSelected";
import { useReceiver, useSender } from "../../router/MidiControl";
import sendThrottled from "../../router/MidiSend";

function ParamKindEnumTile({
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
    console.log(`${componentid} value changed to ${cValue}`);
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
    <select
      className="form-select m-2 w-75  text-center bg-dark text-light mx-auto"
      value={cValue}
      onChange={(e) => setCValue(e.target.checked)}
      id={componentid}
      channelid={channelid}
      channellabel={channellabel}
      processorid={processorid}
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
