import {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessage,
} from "../slices/wsSlice";

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${protocol}://${window.location.host}/ws/midi`;
let socket = null;

// Connect thunk
export const connectWs = () => (dispatch, getState) => {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    dispatch(wsConnected());
    console.log("[WS] connected:", WS_URL);
  };

  socket.onclose = (ev) => {
    dispatch(wsDisconnected());
    console.log("[WS] closed:", ev.code, ev.reason || "");
    socket = null;
  };

  socket.onerror = () => {
    dispatch(wsError("WebSocket error"));
  };

  socket.onmessage = (ev) => {
    if (typeof ev.data !== "string") {
      // you said JSON only; ignore binary
      return;
    }

    try {
      const payload = JSON.parse(ev.data);
      dispatch(wsMessage(payload)); // other components can select lastMessage
    } catch (e) {
      dispatch(wsError("Invalid JSON received"));
    }
  };
};

// Disconnect thunk
export const disconnectWs = () => (dispatch) => {
  if (!socket) return;
  try {
    socket.close(1000, "client disconnect");
  } catch {}
};

// Send JSON thunk
export const sendWsJson = (obj) => () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(obj));
};
