import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import knobUrl from "../assets/fader_knob.svg";
import { buildParamChange, clamp } from "../router/MidiControl";
import FaderScale from "./FaderScaleComponent";
import { PARAM_DEFS } from "../domain/ddxParamDefinition";

import {
  normToDb,
  dbToValue14,
  value14ToDb,
  dbToNorm,
} from "../functions/DBFunction";

export default function FaderControl({
  currentValue, // optional controlled value (0..100)
  onChange,
  min = 0,
  max = 100,
  height = 500,
  trackWidth = 5,
  knobSize = 70,
  step = 1,
  channelIndex,
  ic,
  apparatusId,
  sender,
  receiver,
}) {
  const VOLUME_PARAM = PARAM_DEFS.find((p) => p.key === "volume");
  const isControlled = currentValue != null;

  const [internalValue, setInternalValue] = useState(50);
  const value = clamp(isControlled ? currentValue : internalValue, min, max);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const draggingRef = useRef(false);

  // throttle state
  const lastSentAtRef = useRef(0);
  const pendingDbRef = useRef(null);

  const padding = 8;
  const travel = useMemo(
    () => height - padding * 2 - knobSize,
    [height, knobSize]
  );

  // UI value (0..100) -> knob center Y (px)
  const valueToOffset = useCallback(
    (v) => {
      const ratio = (v - min) / (max - min); // 0..1
      return (1 - ratio) * travel + padding + knobSize / 2;
    },
    [min, max, travel, padding, knobSize]
  );

  // clientY -> UI value (0..100)
  const clientYToValue = useCallback(
    (clientY) => {
      const el = containerRef.current;
      if (!el) return value;

      const rect = el.getBoundingClientRect();
      const offsetY = clientY - rect.top;

      const clamped = clamp(offsetY - (padding + knobSize / 2), 0, travel);
      const ratio = 1 - clamped / travel;
      const raw = min + ratio * (max - min);

      const snapped = Math.round(raw / step) * step;
      return clamp(snapped, min, max);
    },
    [value, min, max, travel, padding, knobSize, step]
  );

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  // Convert slider value (0..100) -> dB
  const valueDb = useMemo(() => {
    const db = normToDb(value); // <-- value is 0..100
    return Number.isFinite(db) ? db.toFixed(1) : "-∞";
  }, [value]);

  // Send SysEx for dB
  const sendSysexDb = useCallback(
    (dbStrOrNum) => {
      if (!sender) return;

      const module = channelIndex; // adjust if needed: channelIndex - 1
      const value14 = dbToValue14(dbStrOrNum);
      const changes = [{ module, param: VOLUME_PARAM.id, value14 }];
      const bytes = buildParamChange({ ic, apparatusId, changes });
      sender.send(bytes);
    },
    [sender, channelIndex, ic, apparatusId]
  );

  const sendThrottled = useCallback(
    (dbStrOrNum) => {
      pendingDbRef.current = dbStrOrNum;

      const now = performance.now();
      const minIntervalMs = 20; // 50 Hz
      if (now - lastSentAtRef.current < minIntervalMs) return;

      lastSentAtRef.current = now;
      sendSysexDb(pendingDbRef.current);
    },
    [sendSysexDb]
  );

  const setFromClientY = useCallback(
    (clientY) => {
      const nextValue = clientYToValue(clientY);
      setValue(nextValue);

      const db = normToDb(nextValue); // 0..100 -> dB
      if (Number.isFinite(db)) sendThrottled(db.toFixed(1));
    },
    [clientYToValue, setValue, sendThrottled]
  );

  const startDrag = useCallback(
    (clientY) => {
      draggingRef.current = true;
      setFromClientY(clientY);
    },
    [setFromClientY]
  );

  const onMove = useCallback(
    (clientY) => {
      if (!draggingRef.current) return;
      setFromClientY(clientY);
    },
    [setFromClientY]
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    // flush once
    if (pendingDbRef.current != null) {
      sendSysexDb(pendingDbRef.current);
    }
  }, [sendSysexDb]);

  useEffect(() => {
    const handleMouseMove = (e) => onMove(e.clientY);
    const handleMouseUp = () => endDrag();

    const handleTouchMove = (e) => {
      if (draggingRef.current) e.preventDefault();
      onMove(e.touches[0].clientY);
    };
    const handleTouchEnd = () => endDrag();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onMove, endDrag]);

  // Optional: update slider when receiver sends new value14
  useEffect(() => {
    const changes = receiver?.decoded?.changes;
    if (!Array.isArray(changes)) return;

    for (const change of changes) {
      if (change.module !== channelIndex) continue;
      if (change.param !== VOLUME_PARAM.id) continue;

      const db = value14ToDb(change.value14);
      const nextNorm = dbToNorm(db); // should return 0..100 with your new mapping
      setValue(nextNorm);
    }
  }, [receiver, channelIndex, setValue]);

  const knobCenterY = valueToOffset(value);

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <FaderScale width={0} />
        <div
          ref={containerRef}
          className="fader p-2"
          style={{ height }}
          onMouseDown={(e) => {
            if (
              e.target === containerRef.current ||
              e.target === trackRef.current
            ) {
              startDrag(e.clientY);
            }
          }}
          onTouchStart={(e) => startDrag(e.touches[0].clientY)}
        >
          <div
            ref={trackRef}
            className="fader-track"
            style={{ width: trackWidth }}
            onMouseDown={(e) => startDrag(e.clientY)}
            onTouchStart={(e) => startDrag(e.touches[0].clientY)}
          />

          <div
            className="fader-knob"
            style={{
              width: "30%",
              height: "15%",
              top: knobCenterY,
              backgroundImage: `url(${knobUrl})`,
              backgroundRepeat: "no-repeat",
            }}
            onMouseDown={(e) => startDrag(e.clientY)}
            onTouchStart={(e) => startDrag(e.touches[0].clientY)}
            title={`${value}${` (${valueDb} dB)`}`}
          />
        </div>
      </div>

      <div className="fader-readout p-2">
        <b>{`${valueDb} dB`}</b>
      </div>
    </>
  );
}
