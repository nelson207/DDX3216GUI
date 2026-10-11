import { ParamKind } from "../../domain/ddxParamKind";
import { useParamValue } from "../../router/useParamValue";
import { formatParam } from "../../functions/ParamFormat";
import Knob from "./Knob";

/**
 * One mixer parameter bound to (module, param), rendered with the control that
 * suits its definition:
 *  RANGE            -> knob
 *  ENUM (<= 4)      -> segmented buttons
 *  ENUM control=knob-> stepped knob (e.g. compressor ratio)
 *  ENUM (many)      -> select
 *  SWITCH on/off    -> lit toggle ; SWITCH with two named states -> segmented
 *  ENUMMULTI        -> bitmask button grid
 */
export default function ParamControl({ def, channelid, processorid, label, size }) {
  const { value, update, setHolding } = useParamValue({
    channelid,
    processorid,
    defaultRaw: def.defaultRaw ?? 0,
  });
  const id = `p_${channelid}_${processorid}`;
  const text = label ?? def.shortLabel ?? def.label;
  const raw = Number(value);

  if (def.kind === ParamKind.RANGE) {
    return (
      <Knob
        id={id}
        label={text}
        value={raw}
        min={def.min ?? 0}
        max={def.max ?? 127}
        defaultValue={def.defaultRaw ?? def.min ?? 0}
        display={formatParam(def, raw)}
        size={size}
        onChange={update}
        onHold={setHolding}
      />
    );
  }

  if (def.kind === ParamKind.ENUM) {
    const values = def.values ?? [];
    if (def.control === "knob") {
      return (
        <Knob
          id={id}
          label={text}
          value={raw}
          steps={values}
          defaultValue={def.defaultRaw ?? values[0]}
          display={formatParam(def, raw)}
          size={size}
          onChange={update}
          onHold={setHolding}
        />
      );
    }
    if (values.length <= 4) {
      return (
        <Segmented
          id={id}
          label={text}
          options={values.map((v) => ({ value: v, label: def.labels?.[v] ?? String(v) }))}
          value={raw}
          onChange={(v) => update(v, { immediate: true })}
        />
      );
    }
    return (
      <div className="pc-field">
        <label className="pc-label" htmlFor={id}>
          {text}
        </label>
        <select
          id={id}
          className="pc-select"
          value={Number.isFinite(raw) ? raw : ""}
          onChange={(e) => update(Number(e.target.value), { immediate: true })}
        >
          {values.map((v) => (
            <option key={v} value={v}>
              {def.labels?.[v] ?? v}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (def.kind === ParamKind.SWITCH) {
    const off = formatParam(def, 0);
    const on = formatParam(def, 1);
    const isOnOff = /^off$/i.test(off) || /off$/i.test(off);
    if (!isOnOff) {
      // two named states, e.g. Pre / Post
      return (
        <Segmented
          id={id}
          label={text}
          options={[
            { value: 1, label: on },
            { value: 0, label: off },
          ]}
          value={raw ? 1 : 0}
          onChange={(v) => update(v, { immediate: true })}
        />
      );
    }
    return (
      <Toggle
        id={id}
        label={text}
        on={Boolean(raw)}
        onChange={(v) => update(v ? 1 : 0, { immediate: true })}
      />
    );
  }

  if (def.kind === ParamKind.ENUMMULTI) {
    const mask = Number(value) || 0;
    return (
      <div className="pc-field pc-field-wide">
        <div className="pc-label">{text}</div>
        <div className="pc-multi" role="group" aria-label={text}>
          {(def.values ?? []).map((v, i) => {
            const on = (mask & (1 << i)) !== 0;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                className={`pc-chip${on ? " on" : ""}`}
                onClick={() => update(mask ^ (1 << i), { immediate: true })}
              >
                {def.labels?.[v] ?? v}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export function Segmented({ id, label, options, value, onChange }) {
  return (
    <div className="pc-field">
      {label && (
        <div className="pc-label" id={`${id}_l`}>
          {label}
        </div>
      )}
      <div className="pc-seg" role="radiogroup" aria-labelledby={label ? `${id}_l` : undefined}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={`pc-seg-btn${o.value === value ? " on" : ""}`}
            onClick={() => o.value !== value && onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ id, label, on, onChange, compact = false, danger = false }) {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={on}
      className={`pc-toggle${on ? " on" : ""}${compact ? " compact" : ""}${danger ? " danger" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="pc-toggle-led" aria-hidden="true" />
      {label}
    </button>
  );
}
