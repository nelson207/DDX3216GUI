// Or from '@reduxjs/toolkit/query' if not using the auto-generated hooks
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// initialize an empty api service that we'll inject endpoints into later as needed
export const emptySplitApi = createApi({
  baseQuery: fetchBaseQuery({
<<<<<<< HEAD
    baseUrl: "",
=======
    baseUrl: "http://localhost:32768",
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
  }),
  refetchOnMountOrArgChange: true,
  endpoints: () => ({}),
});
