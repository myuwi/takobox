import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { isAxiosError } from "axios";
import qs from "query-string";
import { setUnauthorizedHandler } from "@/api/client";
import { meOptions } from "@/queries/me";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
  interface HistoryState {
    sessionExpired?: boolean;
  }
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAxiosError(error) && error.response && error.response.status < 500) {
            return false;
          }

          return failureCount < 2;
        },
        staleTime: 10 * 1000,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    stringifySearch: (search) => {
      const searchStr = qs.stringify(search, { arrayFormat: "bracket" });
      return searchStr && `?${searchStr}`;
    },
    parseSearch: (search) => {
      return qs.parse(search.slice(1));
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  setUnauthorizedHandler(() => {
    const hadSession = Boolean(queryClient.getQueryData(meOptions.queryKey));
    if (!hadSession) {
      return;
    }

    queryClient.setQueryData(meOptions.queryKey, null);
    void router.navigate({ to: "/login", state: { sessionExpired: true } });
  });

  return router;
}
