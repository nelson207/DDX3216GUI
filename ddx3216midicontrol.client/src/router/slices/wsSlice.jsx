import { createSlice } from "@reduxjs/toolkit";

export const paramKey = (module, param) => `${module}:${param}`;

const initialState = {
  connected: false,
  error: null, // last error (connection or reported by the server)
  // latest known value per "module:param" (server snapshot, websocket or local changes)
  values: {},
  // active scene (same for everyone): { id, name, labels: { [module]: { name, color } } }
  scene: null,
};

function applyChanges(state, changes) {
  if (!Array.isArray(changes)) return;
  for (const c of changes) {
    if (c && c.Module !== undefined && c.Param !== undefined) {
      state.values[paramKey(c.Module, c.Param)] = c.Value;
    }
  }
}

const wsSlice = createSlice({
  name: "ws",
  initialState,
  reducers: {
    wsConnected(state) {
      state.connected = true;
      state.error = null;
    },
    wsDisconnected(state) {
      state.connected = false;
    },
    wsError(state, action) {
      state.error = action.payload ?? "WebSocket error";
    },
    // full state sent by the server on (re)connect: it is the source of truth
    wsSnapshot(state, action) {
      state.values = {};
      applyChanges(state, action.payload);
    },
    // incremental changes from the console or other clients
    wsMessage(state, action) {
      applyChanges(state, action.payload);
    },
    // local change made by this client
    paramSet(state, action) {
      applyChanges(state, [action.payload]);
    },
    wsScene(state, action) {
      const s = action.payload;
      if (!s) return;
      const labels = {};
      for (const l of s.labels ?? []) labels[l.module] = { name: l.name, color: l.color ?? null };
      state.scene = { id: s.id, name: s.name, labels };
    },
    // logout: forget everything that belonged to the session
    wsReset() {
      return initialState;
    },
  },
});

export const {
  wsConnected,
  wsDisconnected,
  wsError,
  wsSnapshot,
  wsMessage,
  paramSet,
  wsScene,
  wsReset,
} = wsSlice.actions;
export default wsSlice.reducer;
