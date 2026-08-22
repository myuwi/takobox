import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, staleTime: Infinity },
    },
  });

interface TestRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: TestRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>{children}</JotaiProvider>
    </QueryClientProvider>
  );

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};
