import {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessage,
  wsScene,
  wsSnapshot,
} from "../slices/wsSlice";
import { MidiApi } from "../apis/MidiApi";

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${protocol}://${window.location.host}/ws/midi`;
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 10000;
const PING_INTERVAL_MS = 10000;
const PONG_TIMEOUT_MS = 25000; // no pong for this long -> assume the link is dead and reconnect

let socket = null;
let reconnectTimer = null;
let pingTimer = null;
let lastPong = 0;
let reconnectDelay = RECONNECT_MIN_MS;
let wanted = false; // true while the app wants a connection

function stopPing() {
  clearInterval(pingTimer);
  pingTimer = null;
}

function startPing(ws) {
  stopPing();
  lastPong = Date.now();
  pingTimer = setInterval(() => {
    if (socket !== ws || ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - lastPong > PONG_TIMEOUT_MS) {
      console.warn("[WS] no pong from server, reconnecting");
      ws.close(4000, "pong timeout");
      return;
    }
    ws.send(JSON.stringify({ type: "ping" }));
  }, PING_INTERVAL_MS);
}

function handleMessage(dispatch, payload) {
  // legacy servers send a bare array of changes
  if (Array.isArray(payload)) {
    dispatch(wsMessage(payload));
    return;
  }
  switch (payload?.type) {
    case "changes":
      dispatch(wsMessage(payload.changes));
      break;
    case "snapshot":
      dispatch(wsSnapshot(payload.changes));
      break;
    case "status":
      // same shape as GET /api/Midi/devices: refresh that cache in place
      dispatch(MidiApi.util.upsertQueryData("getApiMidiDevices", undefined, payload.status));
      break;
    case "scene":
      dispatch(wsScene(payload.scene));
      // scene list (active flag, label counts) may have changed too
      dispatch(MidiApi.util.invalidateTags(["Scenes"]));
      break;
    case "error":
      console.warn("[WS] server:", payload.message);
      dispatch(wsError(payload.message));
      break;
    case "pong":
      break;
    default:
      break;
  }
}

// Connect thunk (auto-reconnects with backoff until disconnectWs is called)
export const connectWs = () => (dispatch) => {
  wanted = true;
  clearTimeout(reconnectTimer);

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const ws = new WebSocket(WS_URL);
  socket = ws;

  ws.onopen = () => {
    reconnectDelay = RECONNECT_MIN_MS;
    dispatch(wsConnected());
    startPing(ws);
    console.log("[WS] connected:", WS_URL);
  };

  ws.onclose = (ev) => {
    // ignore close events from a socket that was already replaced
    if (socket !== ws) return;
    socket = null;
    stopPing();
    dispatch(wsDisconnected());
    console.log("[WS] closed:", ev.code, ev.reason || "");
    // the server refuses the socket when the login expired or the account changed:
    // re-check the session (the app shows the login screen if it is gone)
    dispatch(MidiApi.util.invalidateTags(["Auth"]));

    if (wanted) {
      reconnectTimer = setTimeout(() => dispatch(connectWs()), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    }
  };

  ws.onerror = () => {
    dispatch(wsError("WebSocket error"));
  };

  ws.onmessage = (ev) => {
    if (typeof ev.data !== "string") return; // JSON only
    lastPong = Date.now(); // any traffic proves the link is alive
    try {
      handleMessage(dispatch, JSON.parse(ev.data));
    } catch {
      dispatch(wsError("Invalid JSON received"));
    }
  };
};

// Disconnect thunk
export const disconnectWs = () => () => {
  wanted = false;
  clearTimeout(reconnectTimer);
  stopPing();
  if (!socket) return;
  try {
    socket.close(1000, "client disconnect");
  } catch {
    /* already closed */
  }
};

// Send parameter changes
export const sendWsJson = (changes) => () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "changes", changes }));
};
