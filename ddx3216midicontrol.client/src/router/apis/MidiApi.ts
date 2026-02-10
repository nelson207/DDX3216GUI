import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
<<<<<<< HEAD
    getRoutes: build.query<GetRoutesApiResponse, GetRoutesApiArg>({
      query: () => ({ url: `/_routes` }),
    }),
    getApiDebug: build.query<GetApiDebugApiResponse, GetApiDebugApiArg>({
      query: () => ({ url: `/api/_debug` }),
    }),
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
    getApiMidiDevices: build.query<
      GetApiMidiDevicesApiResponse,
      GetApiMidiDevicesApiArg
    >({
      query: () => ({ url: `/api/Midi/devices` }),
    }),
    getApiMidiStatusByModuleAndParamDefaultValue: build.query<
      GetApiMidiStatusByModuleAndParamDefaultValueApiResponse,
      GetApiMidiStatusByModuleAndParamDefaultValueApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Midi/status/${queryArg["module"]}/${queryArg.param}/${queryArg.defaultValue}`,
      }),
    }),
    postApiMidiOutSelectByIndex: build.mutation<
      PostApiMidiOutSelectByIndexApiResponse,
      PostApiMidiOutSelectByIndexApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Midi/out/select/${queryArg.index}`,
        method: "POST",
      }),
    }),
    postApiMidiInSelectByIndex: build.mutation<
      PostApiMidiInSelectByIndexApiResponse,
      PostApiMidiInSelectByIndexApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Midi/in/select/${queryArg.index}`,
        method: "POST",
      }),
    }),
    postApiMidiChannelByChannel: build.mutation<
      PostApiMidiChannelByChannelApiResponse,
      PostApiMidiChannelByChannelApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Midi/channel/${queryArg.channel}`,
        method: "POST",
      }),
    }),
<<<<<<< HEAD
    postApiMidiDevicesRefresh: build.mutation<
      PostApiMidiDevicesRefreshApiResponse,
      PostApiMidiDevicesRefreshApiArg
    >({
      query: () => ({ url: `/api/Midi/devices/refresh`, method: "POST" }),
    }),
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  }),
  overrideExisting: false,
});
export { injectedRtkApi as MidiApi };
<<<<<<< HEAD
export type GetRoutesApiResponse = /** status 200 OK */ string[];
export type GetRoutesApiArg = void;
export type GetApiDebugApiResponse = unknown;
export type GetApiDebugApiArg = void;
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
export type GetApiMidiDevicesApiResponse = /** status 200 OK */ MidiDevicesRead;
export type GetApiMidiDevicesApiArg = void;
export type GetApiMidiStatusByModuleAndParamDefaultValueApiResponse =
  /** status 200 OK */ number;
export type GetApiMidiStatusByModuleAndParamDefaultValueApiArg = {
  module: number;
  param: number;
  defaultValue: number;
};
export type PostApiMidiOutSelectByIndexApiResponse = unknown;
export type PostApiMidiOutSelectByIndexApiArg = {
  index: number;
};
export type PostApiMidiInSelectByIndexApiResponse = unknown;
export type PostApiMidiInSelectByIndexApiArg = {
  index: number;
};
export type PostApiMidiChannelByChannelApiResponse = unknown;
export type PostApiMidiChannelByChannelApiArg = {
  channel: number;
};
<<<<<<< HEAD
export type PostApiMidiDevicesRefreshApiResponse = unknown;
export type PostApiMidiDevicesRefreshApiArg = void;
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
export type MidiDevices = {
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
<<<<<<< HEAD
export type MidiDeviceInfoPortName = {
=======
export type MidiDeviceInfo = {
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  index?: number;
  name?: string | null;
};
export type MidiDevicesRead = {
<<<<<<< HEAD
  inDevices?: MidiDeviceInfoPortName[] | null;
  outDevices?: MidiDeviceInfoPortName[] | null;
=======
  inDevices?: MidiDeviceInfo[] | null;
  outDevices?: MidiDeviceInfo[] | null;
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
export const {
<<<<<<< HEAD
  useGetRoutesQuery,
  useGetApiDebugQuery,
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  useGetApiMidiDevicesQuery,
  useGetApiMidiStatusByModuleAndParamDefaultValueQuery,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
<<<<<<< HEAD
  usePostApiMidiDevicesRefreshMutation,
=======
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
} = injectedRtkApi;
