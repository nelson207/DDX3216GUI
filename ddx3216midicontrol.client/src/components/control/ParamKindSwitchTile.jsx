import { useParamValue } from "../../router/useParamValue";

function ParamKindSwitchTile({ def, value, componentid, channelid, processorid }) {
  const { value: cValue, update } = useParamValue({
    channelid,
    processorid,
    defaultRaw: value,
  });
  const on = Boolean(Number(cValue));

  return (
    <button
      type="button"
      id={componentid}
      aria-pressed={on}
      className={`btn w-100 text-truncate fw-bold ${
        on ? (def.classSelected ?? "btn-light") : "btn-outline-light"
      }`}
      onClick={() => update(on ? 0 : 1, { immediate: true })}
    >
      {def.format ? def.format(on ? 1 : 0) : on ? "On" : "Off"}
    </button>
  );
}

export default ParamKindSwitchTile;
