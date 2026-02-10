import { configureStore } from "@reduxjs/toolkit";
import midiReducer from "../slices/MidiSlice";
import wsReducer from "../slices/wsSlice";
import { emptySplitApi } from "../apis/emptyApi";
import { setupListeners } from "@reduxjs/toolkit/query";

export const store = configureStore({
  reducer: {
    midi: midiReducer,
    ws: wsReducer,
    [emptySplitApi.reducerPath]: emptySplitApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(emptySplitApi.middleware),
});

setupListeners(store.dispatch);
