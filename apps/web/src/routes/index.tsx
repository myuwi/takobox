import { createFileRoute, redirect } from "@tanstack/react-router";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .query({ ...meOptions, staleTime: "static" })
      .catch(() => null);

    throw redirect({ to: user ? "/files" : "/login" });
  },
});
