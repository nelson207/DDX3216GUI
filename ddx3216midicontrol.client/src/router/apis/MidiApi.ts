import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiAuthState: build.query<
      GetApiAuthStateApiResponse,
      GetApiAuthStateApiArg
    >({
      query: () => ({ url: `/api/Auth/state` }),
    }),
    postApiAuthSetup: build.mutation<
      PostApiAuthSetupApiResponse,
      PostApiAuthSetupApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Auth/setup`,
        method: "POST",
        body: queryArg.loginRequest,
      }),
    }),
    postApiAuthLogin: build.mutation<
      PostApiAuthLoginApiResponse,
      PostApiAuthLoginApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Auth/login`,
        method: "POST",
        body: queryArg.loginRequest,
      }),
    }),
    postApiAuthLogout: build.mutation<
      PostApiAuthLogoutApiResponse,
      PostApiAuthLogoutApiArg
    >({
      query: () => ({ url: `/api/Auth/logout`, method: "POST" }),
    }),
    postApiAuthPassword: build.mutation<
      PostApiAuthPasswordApiResponse,
      PostApiAuthPasswordApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Auth/password`,
        method: "POST",
        body: queryArg.changePasswordRequest,
      }),
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
    getApiScenes: build.query<GetApiScenesApiResponse, GetApiScenesApiArg>({
      query: () => ({ url: `/api/Scenes` }),
    }),
    postApiScenes: build.mutation<
      PostApiScenesApiResponse,
      PostApiScenesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes`,
        method: "POST",
        body: queryArg.createSceneRequest,
      }),
    }),
    getApiScenesActive: build.query<
      GetApiScenesActiveApiResponse,
      GetApiScenesActiveApiArg
    >({
      query: () => ({ url: `/api/Scenes/active` }),
    }),
    putApiScenesById: build.mutation<
      PutApiScenesByIdApiResponse,
      PutApiScenesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}`,
        method: "PUT",
        body: queryArg.renameSceneRequest,
      }),
    }),
    deleteApiScenesById: build.mutation<
      DeleteApiScenesByIdApiResponse,
      DeleteApiScenesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
    postApiScenesByIdCapture: build.mutation<
      PostApiScenesByIdCaptureApiResponse,
      PostApiScenesByIdCaptureApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}/capture`,
        method: "POST",
      }),
    }),
    postApiScenesByIdActivate: build.mutation<
      PostApiScenesByIdActivateApiResponse,
      PostApiScenesByIdActivateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}/activate`,
        method: "POST",
        body: queryArg.activateSceneRequest,
      }),
    }),
    putApiScenesByIdLabelsAndModule: build.mutation<
      PutApiScenesByIdLabelsAndModuleApiResponse,
      PutApiScenesByIdLabelsAndModuleApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}/labels/${queryArg["module"]}`,
        method: "PUT",
        body: queryArg.setLabelRequest,
      }),
    }),
    putApiScenesByIdPairsAndModule: build.mutation<
      PutApiScenesByIdPairsAndModuleApiResponse,
      PutApiScenesByIdPairsAndModuleApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Scenes/${queryArg.id}/pairs/${queryArg["module"]}`,
        method: "PUT",
        body: queryArg.setPairRequest,
      }),
    }),
    getApiUsers: build.query<GetApiUsersApiResponse, GetApiUsersApiArg>({
      query: () => ({ url: `/api/Users` }),
    }),
    postApiUsers: build.mutation<PostApiUsersApiResponse, PostApiUsersApiArg>({
      query: (queryArg) => ({
        url: `/api/Users`,
        method: "POST",
        body: queryArg.createUserRequest,
      }),
    }),
    putApiUsersById: build.mutation<
      PutApiUsersByIdApiResponse,
      PutApiUsersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Users/${queryArg.id}`,
        method: "PUT",
        body: queryArg.updateUserRequest,
      }),
    }),
    deleteApiUsersById: build.mutation<
      DeleteApiUsersByIdApiResponse,
      DeleteApiUsersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Users/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as MidiApi };
export type GetApiAuthStateApiResponse = /** status 200 OK */ AuthState;
export type GetApiAuthStateApiArg = void;
export type PostApiAuthSetupApiResponse = /** status 200 OK */ AuthUser;
export type PostApiAuthSetupApiArg = {
  loginRequest: LoginRequest;
};
export type PostApiAuthLoginApiResponse = /** status 200 OK */ AuthUser;
export type PostApiAuthLoginApiArg = {
  loginRequest: LoginRequest;
};
export type PostApiAuthLogoutApiResponse = unknown;
export type PostApiAuthLogoutApiArg = void;
export type PostApiAuthPasswordApiResponse = unknown;
export type PostApiAuthPasswordApiArg = {
  changePasswordRequest: ChangePasswordRequest;
};
export type GetHealthApiResponse = unknown;
export type GetHealthApiArg = void;
export type GetApiMidiDevicesApiResponse = /** status 200 OK */ MidiDevices;
export type GetApiMidiDevicesApiArg = void;
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
export type GetApiScenesApiResponse = /** status 200 OK */ SceneSummaryDto[];
export type GetApiScenesApiArg = void;
export type PostApiScenesApiResponse = /** status 200 OK */ SceneSummaryDto;
export type PostApiScenesApiArg = {
  createSceneRequest: CreateSceneRequest;
};
export type GetApiScenesActiveApiResponse = /** status 200 OK */ ActiveSceneDto;
export type GetApiScenesActiveApiArg = void;
export type PutApiScenesByIdApiResponse = unknown;
export type PutApiScenesByIdApiArg = {
  id: number;
  renameSceneRequest: RenameSceneRequest;
};
export type DeleteApiScenesByIdApiResponse = unknown;
export type DeleteApiScenesByIdApiArg = {
  id: number;
};
export type PostApiScenesByIdCaptureApiResponse =
  /** status 200 OK */ CaptureSceneResult;
export type PostApiScenesByIdCaptureApiArg = {
  id: number;
};
export type PostApiScenesByIdActivateApiResponse =
  /** status 200 OK */ ActivateSceneResult;
export type PostApiScenesByIdActivateApiArg = {
  id: number;
  activateSceneRequest: ActivateSceneRequest;
};
export type PutApiScenesByIdLabelsAndModuleApiResponse = unknown;
export type PutApiScenesByIdLabelsAndModuleApiArg = {
  id: number;
  module: number;
  setLabelRequest: SetLabelRequest;
};
export type PutApiScenesByIdPairsAndModuleApiResponse =
  /** status 200 OK */ SetPairResult;
export type PutApiScenesByIdPairsAndModuleApiArg = {
  id: number;
  module: number;
  setPairRequest: SetPairRequest;
};
export type GetApiUsersApiResponse = /** status 200 OK */ UserDto[];
export type GetApiUsersApiArg = void;
export type PostApiUsersApiResponse = /** status 200 OK */ UserDto;
export type PostApiUsersApiArg = {
  createUserRequest: CreateUserRequest;
};
export type PutApiUsersByIdApiResponse = unknown;
export type PutApiUsersByIdApiArg = {
  id: number;
  updateUserRequest: UpdateUserRequest;
};
export type DeleteApiUsersByIdApiResponse = unknown;
export type DeleteApiUsersByIdApiArg = {
  id: number;
};
export type AuthUser = {
  id?: number;
  userName?: string | null;
  role?: string | null;
};
export type AuthState = {
  setupRequired?: boolean;
  user?: AuthUser;
};
export type LoginRequest = {
  userName?: string | null;
  password?: string | null;
};
export type ChangePasswordRequest = {
  currentPassword?: string | null;
  newPassword?: string | null;
};
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
export type SceneSummaryDto = {
  id?: number;
  name?: string | null;
  updatedAt?: string;
  parametersCapturedAt?: string | null;
  parameterCount?: number;
  labelCount?: number;
  isActive?: boolean;
};
export type CreateSceneRequest = {
  name?: string | null;
  captureParameters?: boolean;
  copyLabelsFromSceneId?: number | null;
};
export type SceneLabelDto = {
  module?: number;
  name?: string | null;
  color?: string | null;
};
export type ActiveSceneDto = {
  id?: number;
  name?: string | null;
  labels?: SceneLabelDto[] | null;
  pairs?: number[] | null;
};
export type RenameSceneRequest = {
  name?: string | null;
};
export type CaptureSceneResult = {
  parametersCaptured?: number;
};
export type ActivateSceneResult = {
  parametersSent?: number;
  estimatedSeconds?: number;
};
export type ActivateSceneRequest = {
  mode?: string | null;
};
export type SetLabelRequest = {
  name?: string | null;
  color?: string | null;
};
export type SetPairResult = {
  oddModule?: number;
  paired?: boolean;
  valuesCopied?: number;
  note?: string | null;
};
export type SetPairRequest = {
  paired?: boolean;
};
export type UserDto = {
  id?: number;
  userName?: string | null;
  role?: string | null;
  createdAt?: string;
};
export type CreateUserRequest = {
  userName?: string | null;
  password?: string | null;
  role?: string | null;
};
export type UpdateUserRequest = {
  role?: string | null;
  password?: string | null;
};
export const {
  useGetApiAuthStateQuery,
  usePostApiAuthSetupMutation,
  usePostApiAuthLoginMutation,
  usePostApiAuthLogoutMutation,
  usePostApiAuthPasswordMutation,
  useGetHealthQuery,
  useGetApiMidiDevicesQuery,
  useGetApiMidiStateQuery,
  usePostApiMidiOutSelectByIndexMutation,
  usePostApiMidiInSelectByIndexMutation,
  usePostApiMidiChannelByChannelMutation,
  usePostApiMidiDevicesRefreshMutation,
  useGetApiScenesQuery,
  usePostApiScenesMutation,
  useGetApiScenesActiveQuery,
  usePutApiScenesByIdMutation,
  useDeleteApiScenesByIdMutation,
  usePostApiScenesByIdCaptureMutation,
  usePostApiScenesByIdActivateMutation,
  usePutApiScenesByIdLabelsAndModuleMutation,
  usePutApiScenesByIdPairsAndModuleMutation,
  useGetApiUsersQuery,
  usePostApiUsersMutation,
  usePutApiUsersByIdMutation,
  useDeleteApiUsersByIdMutation,
} = injectedRtkApi;
