// Cache tags for the generated MidiApi (kept separate so codegen can overwrite MidiApi.ts)
import { MidiApi } from "./MidiApi";

export const MidiApiTagged = MidiApi.enhanceEndpoints({
  addTagTypes: ["Status", "Devices"],
  endpoints: {
    getApiMidiDevices: { providesTags: ["Devices"] },
    getApiMidiStatusByModuleAndParamDefaultValue: { providesTags: ["Status"] },
    postApiMidiInSelectByIndex: { invalidatesTags: ["Devices", "Status"] },
    postApiMidiOutSelectByIndex: { invalidatesTags: ["Devices", "Status"] },
    postApiMidiChannelByChannel: { invalidatesTags: ["Devices"] },
    postApiMidiDevicesRefresh: { invalidatesTags: ["Devices"] },
  },
});

// Re-read every mounted parameter from the server (e.g. after a reconnect)
export const resyncAllParams = () =>
  MidiApiTagged.util.invalidateTags(["Status"]);
