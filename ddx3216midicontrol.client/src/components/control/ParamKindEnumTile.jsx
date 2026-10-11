import { useParamValue } from "../../router/useParamValue";

function ParamKindEnumTile({ def, value, componentid, channelid, processorid }) {
  const { value: cValue, update, loading } = useParamValue({
    channelid,
    processorid,
    defaultRaw: value,
  });

  return (
    <select
      className="form-select bg-dark text-light text-center"
      value={cValue ?? ""}
      disabled={loading && cValue === undefined}
      onChange={(e) => update(Number(e.target.value), { immediate: true })}
      id={componentid}
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
