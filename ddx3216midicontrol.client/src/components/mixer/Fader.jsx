import { useEffect, useRef } from "react";
import { useParamValue } from "../../router/useParamValue";
import {
  RAW_MAX,
  RAW_MIN,
  RAW_UNITY,
  SCALE_MARKS,
  dbToPos,
  dbToRaw,
  formatDb,
  posToRaw,
  rawToDb,
  rawToPos,
} from "../../functions/DBFunction";
import { clamp } from "../../functions/ChannelFunction";

const DOUBLE_TAP_MS = 300;
const TAP_MOVE_PX = 6;
const FINE_FACTOR = 0.25;

/**
 * Console-style vertical fader (pointer events, works with mouse, touch and pen).
 * - Relative drag: grabbing anywhere on the track moves the cap from where it is,
 *   it never jumps to the finger.
 * - Double tap / double click toggles 0 dB.
 * - Shift + drag = fine; mouse wheel = 0.5 dB steps; keyboard arrows / PgUp / PgDn / Home / End.
 * - Horizontal swipes are left to the browser so the strip list can still scroll.
 */
function Fader({ def, componentid, channelid, channellabel, processorid }) {
  const { value, update, setHolding } = useParamValue({
    channelid,
    processorid,
    defaultRaw: def.defaultRaw,
  });

  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);
  const wheelRef = useRef(null);

  const raw = Number.isFinite(Number(value)) ? Number(value) : def.defaultRaw;
  const pos = rawToPos(raw);

  const setRaw = (next, opts) => {
    const v = clamp(Math.round(next), RAW_MIN, RAW_MAX);
    if (dragRef.current) dragRef.current.last = v;
    update(v, opts);
  };

  const nudgeDb = (deltaDb) => {
    const db = raw <= RAW_MIN ? -80 : rawToDb(raw);
    setRaw(dbToRaw(db + deltaDb), { immediate: true });
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      startPos: pos,
      last: raw,
      travel: rect.height,
      moved: false,
    };
    setHolding(true);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dy = drag.startY - e.clientY;
    if (!drag.moved && Math.abs(dy) < TAP_MOVE_PX) return;
    drag.moved = true;
    const factor = e.shiftKey ? FINE_FACTOR : 1;
    setRaw(posToRaw(drag.startPos + (dy / drag.travel) * factor));
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    setHolding(false);

    if (drag.moved) {
      // make sure the final position is sent even if it was throttled
      setRaw(drag.last, { immediate: true });
      lastTapRef.current = 0;
      return;
    }
    if (e.type === "pointercancel") return;

    const now = performance.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      setRaw(raw === RAW_UNITY ? RAW_MIN : RAW_UNITY, { immediate: true });
    } else {
      lastTapRef.current = now;
    }
  };

  // latest wheel handler for the (stable) native listener below
  useEffect(() => {
    wheelRef.current = (e) => {
      // leave horizontal (strip list) scrolling alone
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      nudgeDb(e.deltaY < 0 ? 0.5 : -0.5);
    };
  });

  // Wheel needs a non-passive listener to be able to preventDefault
  useEffect(() => {
    const el = trackRef.current?.parentElement;
    if (!el) return;
    const onWheel = (e) => wheelRef.current?.(e);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (e) => {
    const steps = {
      ArrowUp: 0.5,
      ArrowRight: 0.5,
      ArrowDown: -0.5,
      ArrowLeft: -0.5,
      PageUp: 5,
      PageDown: -5,
    };
    if (e.key in steps) {
      e.preventDefault();
      nudgeDb(steps[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setRaw(RAW_MAX, { immediate: true });
    } else if (e.key === "End") {
      e.preventDefault();
      setRaw(RAW_MIN, { immediate: true });
    }
  };

  const display = formatDb(raw);

  return (
    <div className="fader">
      <div
        className="fader-body"
        id={componentid}
        role="slider"
        tabIndex={0}
        aria-label={`${channellabel} level`}
        aria-orientation="vertical"
        aria-valuemin={RAW_MIN}
        aria-valuemax={RAW_MAX}
        aria-valuenow={raw}
        aria-valuetext={`${display} dB`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <div className="fader-scale" aria-hidden="true">
          {SCALE_MARKS.map((db) => (
            <span
              key={db}
              className={`fader-mark${db === 0 ? " unity" : ""}`}
              style={{ bottom: `${dbToPos(db) * 100}%` }}
            >
              {db === -80 ? "∞" : db > 0 ? `+${db}` : db}
            </span>
          ))}
        </div>
        <div className="fader-track" ref={trackRef}>
          <div className="fader-slot" />
          <div className="fader-fill" style={{ height: `${pos * 100}%` }} />
          <div className="fader-cap" style={{ bottom: `${pos * 100}%` }} />
        </div>
      </div>
      <output htmlFor={componentid} className="fader-value">
        {display}
      </output>
    </div>
  );
}

export default Fader;
