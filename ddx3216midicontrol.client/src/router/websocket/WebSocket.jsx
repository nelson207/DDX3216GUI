import {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessage,
} from "../slices/wsSlice";

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${protocol}://${window.location.host}/ws/midi`;
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 10000;

let socket = null;
let reconnectTimer = null;
let reconnectDelay = RECONNECT_MIN_MS;
let wanted = false; // true while the app wants a connection

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
    console.log("[WS] connected:", WS_URL);
  };

  ws.onclose = (ev) => {
    // ignore close events from a socket that was already replaced
    if (socket !== ws) return;
    socket = null;
    dispatch(wsDisconnected());
    console.log("[WS] closed:", ev.code, ev.reason || "");

    if (wanted) {
      reconnectTimer = setTimeout(() => dispatch(connectWs()), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    }
  };

  ws.onerror = () => {
    dispatch(wsError("WebSocket error"));
  };

  ws.onmessage = (ev) => {
    if (typeof ev.data !== "string") {
      // JSON only; ignore binary
      return;
    }

    try {
      const payload = JSON.parse(ev.data);
      dispatch(wsMessage(payload)); // other components can select lastMessage
    } catch {
      dispatch(wsError("Invalid JSON received"));
    }
  };
};

// Disconnect thunk
export const disconnectWs = () => () => {
  wanted = false;
  clearTimeout(reconnectTimer);
  if (!socket) return;
  try {
    socket.close(1000, "client disconnect");
  } catch {
    /* already closed */
  }
};

// Send JSON thunk
export const sendWsJson = (obj) => () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(obj));
};
