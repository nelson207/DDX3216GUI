/** Readable message from an RTK Query error (server returns plain-text messages for 4xx). */
export function apiErrorText(error) {
  if (!error) return null;
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (error.status === 403) return "Your account isn't allowed to do that.";
  if (typeof error.data === "string" && error.data) return error.data;
  if (error.data?.title) return error.data.title;
  if (error.error) return error.error;
  return "Request failed";
}
