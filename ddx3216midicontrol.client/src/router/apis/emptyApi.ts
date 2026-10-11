// Or from '@reduxjs/toolkit/query' if not using the auto-generated hooks
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "" });

// A 401 means the login cookie expired or was revoked: re-check the auth state,
// which swaps the app for the login screen.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith("/api/auth/")) {
    api.dispatch(emptySplitApi.util.invalidateTags(["Auth"]));
  }
  return result;
};

// initialize an empty api service that we'll inject endpoints into later as needed
export const emptySplitApi = createApi({
  baseQuery,
  tagTypes: ["Auth", "Devices", "Scenes", "Users"],
  refetchOnMountOrArgChange: true,
  endpoints: () => ({}),
});
