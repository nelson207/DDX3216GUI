import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  lastMessage: null, // last JSON message
  error: null,
};

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
    },
  },
});

export const { wsConnected, wsDisconnected, wsError, wsMessage } =
  wsSlice.actions;
export default wsSlice.reducer;
