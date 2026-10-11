import { useSelector } from "react-redux";
import { MidiApi, useGetApiAuthStateQuery } from "./apis/MidiApi";
import "./apis/MidiApiTags";

export const Roles = { Admin: "Admin", Operator: "Operator", Viewer: "Viewer" };

const selectAuthState = MidiApi.endpoints.getApiAuthState.select();

/** Logged-in user from the cached auth state (cheap: no request, safe to use in every control). */
export function useCurrentUser() {
  const user = useSelector((s) => selectAuthState(s).data?.user ?? null);
  return {
    user,
    isAdmin: user?.role === Roles.Admin,
    canOperate: user?.role === Roles.Admin || user?.role === Roles.Operator,
  };
}

/** Subscribes to the auth state (used by the gate at the top of the app). */
export function useAuthState() {
  const { data, isLoading, isError, refetch } = useGetApiAuthStateQuery();
  return {
    loading: isLoading,
    error: isError,
    refetch,
    setupRequired: data?.setupRequired ?? false,
    user: data?.user ?? null,
  };
}
