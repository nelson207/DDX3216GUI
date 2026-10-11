import { useParamValue } from "../../router/useParamValue";

/** Latching on/off strip button (MUTE etc.) */
function StripButton({ def, componentid, channelid, processorid, variant }) {
  const { value, update } = useParamValue({
    channelid,
    processorid,
    defaultRaw: def.defaultRaw,
  });
  const on = Boolean(Number(value));

  return (
    <button
      type="button"
      id={componentid}
      className={`strip-btn strip-btn-${variant}${on ? " on" : ""}`}
      aria-pressed={on}
      onClick={() => update(on ? 0 : 1, { immediate: true })}
    >
      {def.label.toUpperCase()}
    </button>
  );
}

export default StripButton;
