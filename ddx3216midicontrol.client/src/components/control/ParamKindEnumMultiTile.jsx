import { useParamValue } from "../../router/useParamValue";

/**
 * Multi-select as a bitmask: option i toggles bit i of the raw value
 * (e.g. Route to Bus: bit 0 = 1-2, bit 1 = 3-4, ...).
 */
function ParamKindEnumMultiTile({
  def,
  value,
  componentid,
  channelid,
  processorid,
}) {
  const { value: cValue, update } = useParamValue({
    channelid,
    processorid,
    defaultRaw: value,
  });
  const mask = Number(cValue) || 0;

  return (
    <div className="multi-grid" id={componentid} role="group">
      {(def.values ?? []).map((v, i) => {
        const on = (mask & (1 << i)) !== 0;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            className={`btn btn-sm fw-bold ${
              on ? (def.classSelected ?? "btn-light") : "btn-outline-light"
            }`}
            onClick={() => update(mask ^ (1 << i), { immediate: true })}
          >
            {def.labels?.[v] ?? v}
          </button>
        );
      })}
    </div>
  );
}

export default ParamKindEnumMultiTile;
