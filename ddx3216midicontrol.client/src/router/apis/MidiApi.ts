import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRoutes: build.query<GetRoutesApiResponse, GetRoutesApiArg>({
      query: () => ({ url: `/_routes` }),
    }),
    getApiDebug: build.query<GetApiDebugApiResponse, GetApiDebugApiArg>({
      query: () => ({ url: `/api/_debug` }),
    }),
    getHealth: build.query<GetHealthApiResponse, GetHealthApiArg>({
      query: () => ({ url: `/health` }),
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
    getApiMidiState: build.query<
      GetApiMidiStateApiResponse,
      GetApiMidiStateApiArg
    >({
      query: () => ({ url: `/api/Midi/state` }),
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
export type GetHealthApiResponse = unknown;
export type GetHealthApiArg = void;
export type GetApiMidiDevicesApiResponse = /** status 200 OK */ MidiDevices;
export type GetApiMidiDevicesApiArg = void;
export type GetApiMidiStatusByModuleAndParamDefaultValueApiResponse =
  /** status 200 OK */ number;
export type GetApiMidiStatusByModuleAndParamDefaultValueApiArg = {
  module: number;
  param: number;
  defaultValue: number;
};
export type GetApiMidiStateApiResponse = /** status 200 OK */ BehringerChange[];
export type GetApiMidiStateApiArg = void;
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
export type MidiDeviceInfoPortName = {
  index?: number;
  name?: string | null;
};
export type MidiDevices = {
  inDevices?: MidiDeviceInfoPortName[] | null;
  outDevices?: MidiDeviceInfoPortName[] | null;
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
  selectedInName?: string | null;
  selectedOutName?: string | null;
  inConnected?: boolean;
  outConnected?: boolean;
};
export type BehringerChange = {
  Module?: number;
  Param?: number;
  Value?: number;
};
export const {
  useGetRoutesQuery,
  useGetApiDebugQuery,
  useGetHealthQuery,
  useGetApiMidiDevicesQuery,
  useGetApiMidiStatusByModuleAndParamDefaultValueQuery,
  useGetApiMidiStateQuery,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
  usePostApiMidiDevicesRefreshMutation,
} = injectedRtkApi;
