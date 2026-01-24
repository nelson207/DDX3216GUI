import { useEffect, useState } from "react";
import sendThrottled from "../../router/MidiSend";
import { VerticalRange } from "../types/VerticalRange";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useSelectedMidi } from "../../router/MidiSelected";

function FaderRange({
  def,
  value,
  componentid,
  channelid,
  channellabel,
  processorid,
  showScale = true,
}) {
  const [faderValue, setFaderValue] = useState(value);
  const { selectedOut, selectedIn, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  useEffect(() => {
    if (!selectedOut) return;
    sendThrottled(channelid, processorid, faderValue, sender, selectedChannel);
  }, [faderValue]);

  useEffect(() => {
    if (lastMsg?.decoded) {
      const changes = lastMsg?.decoded?.changes;

      if (!Array.isArray(changes)) return;

      if (channelid === 0) {
        console.log("MIDI IN: " + lastMsg.data);
      }

      for (const change of changes) {
        if (change.module === channelid) {
          if (change.param === processorid) {
            setFaderValue(change.value14);
          }
        }
      }
    }
  }, [lastMsg]);

  return (
    <>
      <div className="border border-secondary rounded-3 h-100">
        <div className="fader-db">
          <output
            htmlFor={componentid}
            id={`rangeValue_${componentid}`}
            aria-hidden="true"
            className="text-white text-center fw-bold m-2 text-truncate"
          >
            {def.format(faderValue)}
          </output>
        </div>
        <div className="fader-input">
          {
            <VerticalRange
              thumbHeightRatio={0.11}
              thumbSvgShiftPx={0} // try -4, -6, -8 until it looks perfect
              className="form-range"
              type="range"
              min={def.min ?? 0}
              max={def.max ?? 127}
              value={faderValue}
              onChange={(e) => setFaderValue(Number(e.target.value))}
              id={componentid}
              channelid={channelid}
              channellabel={channellabel}
              processorid={processorid}
            />
          }
        </div>
      </div>
    </>
  );
}

export default FaderRange;
