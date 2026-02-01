import { useEffect, useState } from "react";
import { VerticalRange } from "../types/VerticalRange";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useGetApiMidiStatusByModuleAndParamDefaultValueQuery } from "../../router/apis/MidiApi";

function FaderRange({
  def,
  value,
  componentid,
  channelid,
  channellabel,
  processorid,
  showScale = true,
}) {
  const { send } = useSender();
  const { lastMsg } = useReceiver();

  const { data, isLoading } =
    useGetApiMidiStatusByModuleAndParamDefaultValueQuery({
      module: channelid,
      param: processorid,
      defaultValue: value,
    });

  const [cValue, setCValue] = useState();

  useEffect(() => {
    if (data !== undefined) {
      setCValue(data);
    }
  }, [data]);

  // Send whenever cValue changes (but not before it exists)
  const updateAndSendValue = (updater) => {
    setCValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (next === undefined || next === prev) {
        return prev;
      }
      send([
        {
          Module: channelid,
          Param: processorid,
          Value: Number(next),
        },
      ]);

      return next;
    });
  };

  useEffect(() => {
    if (!lastMsg || !Array.isArray(lastMsg)) return;

    for (const change of lastMsg) {
      if (change.Module === channelid && change.Param === processorid) {
        setCValue(change.Value);
        break;
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
            {def.format(cValue)}
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
              value={cValue}
              onChange={(e) => updateAndSendValue(Number(e.target.value))}
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
