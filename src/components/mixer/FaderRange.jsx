import { useEffect, useState } from "react";
import sendThrottled from "../../router/MidiSend";
import { VerticalRange } from "../types/VerticalRange";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useSelectedMidi } from "../../router/MidiSelected";

function FaderRange({
  def,
  value,
  componentId,
  channelId,
  channelLabel,
  processorId,
  showScale = true,
}) {
  const [faderValue, setFaderValue] = useState(value);
  const { selectedOut, selectedIn, selectedChannel } = useSelectedMidi();
  const sender = useSender(selectedOut);
  const { lastMsg } = useReceiver(selectedIn);

  useEffect(() => {
    console.log(`Aqui estou eu ${selectedOut}`);
    if (!selectedOut) return;
    sendThrottled(channelId, processorId, faderValue, sender, selectedChannel);
  }, [faderValue]);

  useEffect(() => {
    if (lastMsg?.decoded) {
      const changes = lastMsg?.decoded?.changes;

      if (!Array.isArray(changes)) return;

      for (const change of changes) {
        if (change.module === channelId) {
          if (change.param === processorId) {
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
            htmlFor={componentId}
            id={`rangeValue_${componentId}`}
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
              id={componentId}
              channelId={channelId}
              channelLabel={channelLabel}
              processorId={processorId}
            />
          }
        </div>
      </div>
    </>
  );
}

export default FaderRange;
