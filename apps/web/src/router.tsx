import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import qs from "query-string";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 10 * 1000,
      },
    },
  });

  return routerWithQueryClient(
    createTanStackRouter({
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
    }),
    queryClient,
  );
}
