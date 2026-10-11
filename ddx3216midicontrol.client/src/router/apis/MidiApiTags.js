// Cache tags for the generated MidiApi (kept separate so codegen can overwrite MidiApi.ts)
import { MidiApi } from "./MidiApi";

export const MidiApiTagged = MidiApi.enhanceEndpoints({
  addTagTypes: ["Devices"],
  endpoints: {
    getApiMidiDevices: { providesTags: ["Devices"] },
    postApiMidiInSelectByIndex: { invalidatesTags: ["Devices"] },
    postApiMidiOutSelectByIndex: { invalidatesTags: ["Devices"] },
    postApiMidiChannelByChannel: { invalidatesTags: ["Devices"] },
    postApiMidiDevicesRefresh: { invalidatesTags: ["Devices"] },
  },
});
