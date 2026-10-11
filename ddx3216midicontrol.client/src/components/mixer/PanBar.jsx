import { useRef } from "react";
import { useParamValue } from "../../router/useParamValue";
import { clamp } from "../../functions/ChannelFunction";

const DOUBLE_TAP_MS = 300;
const TAP_MOVE_PX = 4;

/**
 * Horizontal pan bar (Soundcraft Ui style): relative drag, double tap = center.
 * Vertical swipes are left to the browser.
 */
function PanBar({ def, componentid, channelid, channellabel, processorid }) {
  const { value, update, setHolding } = useParamValue({
    channelid,
    processorid,
    defaultRaw: def.defaultRaw,
  });

  const min = def.min ?? 0;
  const max = def.max ?? 60;
  const center = def.defaultRaw ?? Math.round((min + max) / 2);
  const raw = Number.isFinite(Number(value)) ? Number(value) : center;

  const barRef = useRef(null);
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);

  const setRaw = (next, opts) => {
    const v = clamp(Math.round(next), min, max);
    if (dragRef.current) dragRef.current.last = v;
    update(v, opts);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startRaw: raw,
      last: raw,
      width: barRef.current.getBoundingClientRect().width,
      moved: false,
    };
    setHolding(true);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < TAP_MOVE_PX) return;
    drag.moved = true;
    setRaw(drag.startRaw + (dx / drag.width) * (max - min));
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    setHolding(false);
    if (drag.moved) {
      setRaw(drag.last, { immediate: true });
      return;
    }
    if (e.type === "pointercancel") return;
    const now = performance.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      setRaw(center, { immediate: true });
    } else {
      lastTapRef.current = now;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setRaw(raw - 1, { immediate: true });
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setRaw(raw + 1, { immediate: true });
    } else if (e.key === "Home" || e.key === "Enter") {
      e.preventDefault();
      setRaw(center, { immediate: true });
    }
  };

  // fill from center to current position
  const ratio = (raw - min) / (max - min);
  const centerRatio = (center - min) / (max - min);
  const left = Math.min(ratio, centerRatio) * 100;
  const width = Math.abs(ratio - centerRatio) * 100;
  const label = def.format ? def.format(raw) : raw;

  return (
    <div
      className="pan-bar"
      id={componentid}
      role="slider"
      tabIndex={0}
      aria-label={`${channellabel} pan`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={raw}
      aria-valuetext={String(label)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <div className="pan-track" ref={barRef}>
        <div className="pan-center" />
        <div className="pan-fill" style={{ left: `${left}%`, width: `${width}%` }} />
        <div className="pan-dot" style={{ left: `${ratio * 100}%` }} />
      </div>
      <span className="pan-label">{label === "Center" ? "C" : label}</span>
    </div>
  );
}

export default PanBar;
