import { useEffect, useState } from "react";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useGetApiMidiStatusByModuleAndParamDefaultValueQuery } from "../../router/apis/MidiApi";

function ParamKindEnumMultiTile({
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
    <select
      className="form-select m-2 w-75  text-center bg-dark text-light mx-auto"
      value={cValue}
      onChange={(e) => updateAndSendValue(Number(e.target.value))}
      id={componentid}
      channelid={channelid}
      channellabel={channellabel}
      processorid={processorid}
      multiple={true}
    >
      {loading ? (
        <option>Loading…</option>
      ) : (
        (def.values ?? []).map((v) => (
          <option key={v} value={v}>
            {def.labels?.[v] ?? v}
          </option>
        ))
      )}
    </select>
  );
}

export default ParamKindEnumMultiTile;
