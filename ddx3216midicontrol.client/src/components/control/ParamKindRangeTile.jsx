import { useParamValue } from "../../router/useParamValue";

function ParamKindRangeTile({ def, value, componentid, channelid, processorid }) {
  const {
    value: cValue,
    update,
    setHolding,
    loading,
  } = useParamValue({ channelid, processorid, defaultRaw: value });

  const release = () => {
    setHolding(false);
    update(cValue, { immediate: true });
  };

  return (
    <>
      <input
        className="form-range param-range"
        type="range"
        min={def.min ?? 0}
        max={def.max ?? 127}
        step={def.step ?? 1}
        value={cValue ?? def.defaultRaw ?? 0}
        onChange={(e) => update(Number(e.target.value))}
        onPointerDown={() => setHolding(true)}
        onPointerUp={release}
        onPointerCancel={release}
        onDoubleClick={() => update(def.defaultRaw, { immediate: true })}
        id={componentid}
      />
      <output
        htmlFor={componentid}
        id={`rangeValue_${componentid}`}
        className={`param-value${loading ? " opacity-50" : ""}`}
      >
        {def.format ? def.format(cValue) : cValue}
      </output>
    </>
  );
}

export default ParamKindRangeTile;
