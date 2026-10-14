import { createFileRoute, redirect } from "@tanstack/react-router";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/(app)")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .query({ ...meOptions, staleTime: "static" })
      .catch(() => null);
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
});
