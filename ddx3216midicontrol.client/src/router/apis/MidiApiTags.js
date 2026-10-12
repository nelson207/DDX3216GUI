// Cache tags for the generated MidiApi (kept separate so codegen can overwrite MidiApi.ts)
import { MidiApi } from "./MidiApi";

const invalidates = (...tags) => ({ invalidatesTags: tags });

// side effect only: adds cache tags to the generated endpoints
MidiApi.enhanceEndpoints({
  endpoints: {
    // auth
    getApiAuthState: { providesTags: ["Auth"] },
    postApiAuthSetup: invalidates("Auth"),
    postApiAuthLogin: invalidates("Auth"),
    postApiAuthLogout: invalidates("Auth"),
    postApiAuthPassword: invalidates("Auth"),

    // MIDI
    getApiMidiDevices: { providesTags: ["Devices"] },
    postApiMidiInSelectByIndex: invalidates("Devices"),
    postApiMidiOutSelectByIndex: invalidates("Devices"),
    postApiMidiChannelByChannel: invalidates("Devices"),
    postApiMidiDevicesRefresh: invalidates("Devices"),

    // scenes (the active scene itself arrives over the WebSocket)
    getApiScenes: { providesTags: ["Scenes"] },
    postApiScenes: invalidates("Scenes"),
    putApiScenesById: invalidates("Scenes"),
    deleteApiScenesById: invalidates("Scenes"),
    postApiScenesByIdCapture: invalidates("Scenes"),
    postApiScenesByIdActivate: invalidates("Scenes"),
    putApiScenesByIdLabelsAndModule: invalidates("Scenes"),

    // users
    getApiUsers: { providesTags: ["Users"] },
    postApiUsers: invalidates("Users"),
    putApiUsersById: invalidates("Users"),
    deleteApiUsersById: invalidates("Users"),
  },
});
