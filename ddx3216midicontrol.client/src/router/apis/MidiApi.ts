import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
  }),
  overrideExisting: false,
});
export { injectedRtkApi as MidiApi };
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
export type MidiDevices = {
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
export type MidiDeviceInfo = {
  index?: number;
  name?: string | null;
};
export type MidiDevicesRead = {
  inDevices?: MidiDeviceInfo[] | null;
  outDevices?: MidiDeviceInfo[] | null;
  selectedInDevice?: number | null;
  selectedOutDevice?: number | null;
  channel?: number;
};
export const {
  useGetApiMidiDevicesQuery,
  useGetApiMidiStatusByModuleAndParamDefaultValueQuery,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
} = injectedRtkApi;
