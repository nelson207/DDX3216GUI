import { createSlice } from "@reduxjs/toolkit";
import { MidiApi } from "../apis/MidiApi";

export const paramKey = (module, param) => `${module}:${param}`;

const initialState = {
  connected: false,
  lastMessage: null, // last JSON message
  error: null,
  // latest known value per "module:param" (REST status, websocket or local changes)
  values: {},
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
    wsMessage(state, action) {
      state.lastMessage = action.payload;
      applyChanges(state, action.payload);
    },
    // local change made by this client
    paramSet(state, action) {
      applyChanges(state, [action.payload]);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      MidiApi.endpoints.getApiMidiStatusByModuleAndParamDefaultValue
        .matchFulfilled,
      (state, action) => {
        const args = action.meta.arg.originalArgs;
        if (action.payload !== undefined && action.payload !== null) {
          state.values[paramKey(args.module, args.param)] = action.payload;
        }
      },
    );
  },
});

export const { wsConnected, wsDisconnected, wsError, wsMessage, paramSet } =
  wsSlice.actions;
export default wsSlice.reducer;
