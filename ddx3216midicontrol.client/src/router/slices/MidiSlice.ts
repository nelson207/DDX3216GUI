// midiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MidiApi } from "../apis/MidiApi"; // adjust path

type MidiState = {
  // UI selections
  selectedMidiDeviceIn: number | null;
  selectedMidiDeviceOut: number | null;
  selectedMidiChannel: number;

  // Devices from API
  inDevices: unknown[];
  outDevices: unknown[];

  // Optional: store last error message for UI
  error: string | null;
};

const initialState: MidiState = {
  selectedMidiDeviceIn: null,
  selectedMidiDeviceOut: null,
  selectedMidiChannel: 1,
  inDevices: [],
  outDevices: [],
  error: null,
};

const midiSlice = createSlice({
  name: "midi",
  initialState,
  reducers: {
    setSelectedMidiIn(state, action: PayloadAction<number | null>) {
      state.selectedMidiDeviceIn = action.payload;
    },
    setSelectedMidiOut(state, action: PayloadAction<number | null>) {
      state.selectedMidiDeviceOut = action.payload;
    },
    setSelectedMidiChannel(state, action: PayloadAction<number>) {
      state.selectedMidiChannel = action.payload;
    },
    clearMidiError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // GET /api/Midi/devices -> MidiDevicesRead
    builder.addMatcher(
      MidiApi.endpoints.getApiMidiDevices.matchFulfilled,
      (state, action) => {
        const payload = action.payload;

        state.inDevices = payload?.inDevices ?? [];
        state.outDevices = payload?.outDevices ?? [];

        // updated names: selectedInDevice/selectedOutDevice
        if (payload?.selectedInDevice !== undefined) {
          state.selectedMidiDeviceIn = payload.selectedInDevice ?? null;
        }
        if (payload?.selectedOutDevice !== undefined) {
          state.selectedMidiDeviceOut = payload.selectedOutDevice ?? null;
        }
        if (typeof payload?.channel === "number") {
          state.selectedMidiChannel = payload.channel;
        }

        state.error = null;
      },
    );

    // POST /api/Midi/in/select/{index}
    builder.addMatcher(
      MidiApi.endpoints.postApiMidiInSelectByIndex.matchFulfilled,
      (state, action) => {
        const index = (action as any).meta.arg.originalArgs?.index;
        if (typeof index === "number") state.selectedMidiDeviceIn = index;
        state.error = null;
      },
    );

    // POST /api/Midi/out/select/{index}
    builder.addMatcher(
      MidiApi.endpoints.postApiMidiOutSelectByIndex.matchFulfilled,
      (state, action) => {
        const index = (action as any).meta.arg.originalArgs?.index;
        if (typeof index === "number") state.selectedMidiDeviceOut = index;
        state.error = null;
      },
    );

    // POST /api/Midi/channel/{channel}
    builder.addMatcher(
      MidiApi.endpoints.postApiMidiChannelByChannel.matchFulfilled,
      (state, action) => {
        const channel = (action as any).meta.arg.originalArgs?.channel;
        if (typeof channel === "number") state.selectedMidiChannel = channel;
        state.error = null;
      },
    );

    // Generic error capture for any MidiApi endpoint
    builder.addMatcher(
      (action): action is any =>
        action.type.startsWith("MidiApi/") &&
        (action.type.endsWith("/rejected") || action.type.endsWith("/failed")),
      (state, action) => {
        state.error =
          action?.error?.message ??
          action?.payload?.error ??
          "MIDI request failed";
      },
    );
  },
});

export const {
  setSelectedMidiIn,
  setSelectedMidiOut,
  setSelectedMidiChannel,
  clearMidiError,
} = midiSlice.actions;

export default midiSlice.reducer;
