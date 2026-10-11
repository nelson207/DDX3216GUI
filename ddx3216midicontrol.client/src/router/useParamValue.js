import { useCallback, useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useSender } from "./MidiControl";
import { paramKey, paramSet } from "./slices/wsSlice";
import { useCurrentUser } from "./useAuth";

// Minimum time between two websocket sends for the same param while dragging.
const SEND_INTERVAL_MS = 30;

/**
 * Shared state for one mixer parameter (module + param):
 * - value comes from the store (server snapshot on connect + websocket changes
 *   + local changes), falling back to defaultRaw when the server doesn't know it
 * - while the user holds the control, a local override wins so incoming
 *   echoes don't make it jitter
 * - sends are throttled; pass { immediate: true } to flush the final value
 */
export function useParamValue({ channelid, processorid, defaultRaw }) {
  const dispatch = useDispatch();
  const { send } = useSender();
  const { canOperate } = useCurrentUser();
  const canOperateRef = useRef(canOperate);
  useEffect(() => {
    canOperateRef.current = canOperate;
  }, [canOperate]);
  const stored = useSelector(
    (s) => s.ws.values[paramKey(channelid, processorid)],
  );

  const [override, setOverride] = useState(undefined);
  const holdingRef = useRef(false);
  const lastSentRef = useRef(undefined);
  const lastSendTimeRef = useRef(0);
  const pendingRef = useRef(null);

  useEffect(() => () => clearTimeout(pendingRef.current), []);

  // value changed elsewhere (console / other client / snapshot): forget what we last sent,
  // so setting it back to that value is sent again instead of being skipped as a duplicate
  useEffect(() => {
    if (stored !== lastSentRef.current) lastSentRef.current = undefined;
  }, [stored]);

  const flush = useCallback(
    (next) => {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
      // NaN/null would make the server's JSON deserializer throw and drop the socket
      if (!Number.isFinite(Number(next))) return;
      if (next === lastSentRef.current) return;
      lastSentRef.current = next;
      lastSendTimeRef.current = performance.now();
      send([{ Module: channelid, Param: processorid, Value: Number(next) }]);
    },
    [send, channelid, processorid],
  );

  const update = useCallback(
    (next, { immediate = false } = {}) => {
      if (next === undefined || next === null) return;
      if (!canOperateRef.current) return; // read-only account (the server refuses it too)
      if (holdingRef.current) setOverride(next);
      dispatch(paramSet({ Module: channelid, Param: processorid, Value: next }));

      const elapsed = performance.now() - lastSendTimeRef.current;
      if (immediate || elapsed >= SEND_INTERVAL_MS) {
        flush(next);
      } else {
        clearTimeout(pendingRef.current);
        pendingRef.current = setTimeout(
          () => flush(next),
          SEND_INTERVAL_MS - elapsed,
        );
      }
    },
    [dispatch, flush, channelid, processorid],
  );

  const setHolding = useCallback((holding) => {
    holdingRef.current = holding;
    if (!holding) setOverride(undefined);
  }, []);

  return {
    value: override ?? stored ?? defaultRaw,
    readOnly: !canOperate,
    update,
    setHolding,
  };
}

/**
 * Read-only snapshot of several params of one module, keyed by def.key
 * (falls back to defaultRaw). For graphs that depend on many values.
 */
export function useParamSnapshot(channelid, defs) {
  return useSelector((s) => {
    const out = {};
    for (const def of defs) {
      const v = s.ws.values[paramKey(channelid, def.id)];
      out[def.key] = v ?? def.defaultRaw ?? 0;
    }
    return out;
  }, shallowEqual);
}
