import { useEffect, useRef } from "react";
import { clamp } from "../../functions/ChannelFunction";

const DOUBLE_TAP_MS = 300;
const TAP_MOVE_PX = 4;
const DRAG_PX_FULL_RANGE = 220; // vertical pixels for min -> max
const SWEEP = 270; // degrees of travel
const START = 135; // angle (deg, clockwise from +x) of the minimum

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arc(cx, cy, r, from, to) {
  if (Math.abs(to - from) < 0.01) return "";
  const [x0, y0] = polar(cx, cy, r, from);
  const [x1, y1] = polar(cx, cy, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
}

/**
 * Rotary control (stateless: value + onChange).
 * Relative vertical drag (never jumps), Shift = fine, double tap = default,
 * mouse wheel and arrow keys step by one raw unit.
 * `steps` (array of raw values) turns it into a stepped knob for enums.
 */
export default function Knob({
  id,
  label,
  value,
  min = 0,
  max = 127,
  defaultValue = min,
  display,
  steps,
  disabled = false,
  size = 64,
  onChange,
  onHold,
}) {
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);
  const wheelRef = useRef(null);
  const elRef = useRef(null);

  // stepped knobs work on the index into `steps`
  const lo = steps ? 0 : min;
  const hi = steps ? steps.length - 1 : max;
  const toPos = (v) => (steps ? Math.max(0, steps.indexOf(v)) : v);
  const fromPos = (p) => (steps ? steps[p] : p);

  const pos = clamp(Number.isFinite(Number(value)) ? toPos(Number(value)) : toPos(defaultValue), lo, hi);
  const ratio = hi > lo ? (pos - lo) / (hi - lo) : 0;

  // arcs start at the default when it sits in the middle (bipolar: gain, pan…)
  const defPos = toPos(defaultValue);
  const bipolar = !steps && defPos > lo && defPos < hi;
  const originRatio = bipolar ? (defPos - lo) / (hi - lo) : 0;

  const commit = (p, opts) => {
    const next = fromPos(clamp(Math.round(p), lo, hi));
    if (dragRef.current) dragRef.current.last = next;
    onChange(next, opts);
  };

  const onPointerDown = (e) => {
    if (disabled || (e.button !== undefined && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, y: e.clientY, x: e.clientX, start: pos, last: fromPos(pos), moved: false };
    onHold?.(true);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    // up or right increases
    const delta = d.y - e.clientY + (e.clientX - d.x) * 0.5;
    if (!d.moved && Math.abs(delta) < TAP_MOVE_PX) return;
    d.moved = true;
    const range = hi - lo;
    // stepped knobs: at least ~16px per step so they don't feel twitchy
    const px = steps ? Math.max(DRAG_PX_FULL_RANGE, range * 16) : DRAG_PX_FULL_RANGE;
    const fine = e.shiftKey ? 0.2 : 1;
    commit(d.start + (delta / px) * range * fine);
  };

  const endDrag = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    onHold?.(false);
    if (d.moved) {
      onChange(d.last, { immediate: true });
      lastTapRef.current = 0;
      return;
    }
    if (e.type === "pointercancel") return;
    const now = performance.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      onChange(defaultValue, { immediate: true });
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    wheelRef.current = (e) => {
      if (disabled) return;
      e.preventDefault();
      commit(pos + (e.deltaY < 0 ? 1 : -1), { immediate: true });
    };
  });

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onWheel = (e) => wheelRef.current?.(e);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (e) => {
    if (disabled) return;
    const big = Math.max(1, Math.round((hi - lo) / 10));
    const steps_ = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: big, PageDown: -big };
    if (e.key in steps_) {
      e.preventDefault();
      commit(pos + steps_[e.key], { immediate: true });
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      commit(e.key === "Home" ? lo : hi, { immediate: true });
    } else if (e.key === "Enter" || e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange(defaultValue, { immediate: true });
    }
  };

  const c = 32;
  const r = 25;
  const angle = START + SWEEP * ratio;
  const originAngle = START + SWEEP * originRatio;
  const [px, py] = polar(c, c, 17, angle);
  const [ix, iy] = polar(c, c, 9, angle);

  return (
    <div className={`knob${disabled ? " disabled" : ""}`} style={{ "--knob-size": `${size}px` }}>
      <div className="knob-label" title={label}>
        {label}
      </div>
      <div
        ref={elRef}
        id={id}
        className="knob-dial"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={pos}
        aria-valuetext={display}
        aria-disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path className="knob-track" d={arc(c, c, r, START, START + SWEEP)} />
          <path
            className="knob-value"
            d={arc(c, c, r, Math.min(originAngle, angle), Math.max(originAngle, angle))}
          />
          <circle className="knob-cap" cx={c} cy={c} r={18} />
          <line className="knob-pointer" x1={ix} y1={iy} x2={px} y2={py} />
        </svg>
      </div>
      <output className="knob-readout" htmlFor={id}>
        {display}
      </output>
    </div>
  );
}
