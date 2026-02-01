import { useEffect, useState } from "react";
import { useReceiver, useSender } from "../../router/MidiControl";
import { useGetApiMidiStatusByModuleAndParamDefaultValueQuery } from "../../router/apis/MidiApi";

function ParamKindSwitchTile({
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
      <input
        type="checkbox"
        className="btn-check"
        checked={cValue}
        onChange={(e) => updateAndSendValue(e.target.checked)}
        id={componentid}
        channelid={channelid}
        channellabel={channellabel}
        processorid={processorid}
      />
      <label
        className={`btn m-2 w-75 text-truncate ${cValue ? def.classSelected : "btn-outline-light"}`}
        htmlFor={componentid}
      >
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
          def.format(cValue)
        )}
      </label>
    </>
  );
}

export default ParamKindSwitchTile;
