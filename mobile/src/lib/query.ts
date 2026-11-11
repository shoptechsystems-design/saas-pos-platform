import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./rest";

/** Retry only network/server hiccups, never a definite answer such as 401 or 404. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});
