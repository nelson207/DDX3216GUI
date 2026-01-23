import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedMidiDeviceIn: null,
  selectedMidiDeviceOut: null,
  selectedMidiChannel: 1,
};

const midiSlice = createSlice({
  name: "midi",
  initialState,
  reducers: {
    setSelectedMidiDeviceIn(state, action) {
      state.selectedMidiDeviceIn = action.payload;
    },
    setSelectedMidiDeviceOut(state, action) {
      state.selectedMidiDeviceOut = action.payload;
    },
    setSelectedMidiChannel(state, action) {
      state.selectedMidiChannel = action.payload;
    },
  },
});

export const {
  setSelectedMidiDeviceIn,
  setSelectedMidiDeviceOut,
  setSelectedMidiChannel,
} = midiSlice.actions;
export default midiSlice.reducer;
