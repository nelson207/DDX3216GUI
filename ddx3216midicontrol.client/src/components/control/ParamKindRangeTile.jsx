import { useEffect, useState } from "react";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useGetApiMidiStatusByModuleAndParamDefaultValueQuery } from "../../router/apis/MidiApi";

function ParamKindRangeTile({
  def,
  value,
  componentid,
  channelid,
  channellabel,
  processorid,
}) {
  const { send } = useSender();
  const { lastMsg } = useReceiver();

  const { data, isLoading, isFetching } =
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

  const loading = isLoading || isFetching; // isFetching catches refetches too

  return (
    <>
      <div>
        <input
          className="form-range m-2 w-75 mx-auto"
          type="range"
          min={def.min ?? 0}
          max={def.max ?? 127}
          value={cValue}
          onChange={(e) => updateAndSendValue(Number(e.target.value))}
          onDoubleClick={() => updateAndSendValue(def.defaultRaw)}
          id={componentid}
        />
      </div>
      {loading ? (
        <span className="d-inline-flex align-items-center gap-2">
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          <span>Loading…</span>
        </span>
      ) : (
        <output
          htmlFor={componentid}
          id={`rangeValue_${componentid}`}
          aria-hidden="true"
        >
          {def.format(cValue)}
        </output>
      )}
    </>
  );
}

export default ParamKindRangeTile;
