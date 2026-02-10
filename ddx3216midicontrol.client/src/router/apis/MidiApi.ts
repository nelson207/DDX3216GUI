import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRoutes: build.query<GetRoutesApiResponse, GetRoutesApiArg>({
      query: () => ({ url: `/_routes` }),
    }),
    getApiDebug: build.query<GetApiDebugApiResponse, GetApiDebugApiArg>({
      query: () => ({ url: `/api/_debug` }),
    }),
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
    postApiMidiDevicesRefresh: build.mutation<
      PostApiMidiDevicesRefreshApiResponse,
      PostApiMidiDevicesRefreshApiArg
    >({
      query: () => ({ url: `/api/Midi/devices/refresh`, method: "POST" }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as MidiApi };
export type GetRoutesApiResponse = /** status 200 OK */ string[];
export type GetRoutesApiArg = void;
export type GetApiDebugApiResponse = unknown;
export type GetApiDebugApiArg = void;
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
export type PostApiMidiDevicesRefreshApiResponse = unknown;
export type PostApiMidiDevicesRefreshApiArg = void;
export type MidiDevices = {
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
export type MidiDeviceInfoPortName = {
  index?: number;
  name?: string | null;
};
export type MidiDevicesRead = {
  inDevices?: MidiDeviceInfoPortName[] | null;
  outDevices?: MidiDeviceInfoPortName[] | null;
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
export const {
  useGetRoutesQuery,
  useGetApiDebugQuery,
  useGetApiMidiDevicesQuery,
  useGetApiMidiStatusByModuleAndParamDefaultValueQuery,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
  usePostApiMidiDevicesRefreshMutation,
} = injectedRtkApi;
