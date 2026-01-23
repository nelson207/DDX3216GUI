import { configureStore } from "@reduxjs/toolkit";
import midiReducer from "../slices/midiSlice";

export const store = configureStore({
  reducer: {
    midi: midiReducer,
  },
});
