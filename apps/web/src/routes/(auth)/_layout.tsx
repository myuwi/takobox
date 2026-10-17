import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .query({ ...meOptions, staleTime: "static" })
      .catch(() => null);
    if (user) {
      throw redirect({ to: "/files" });
    }
  },
  component: Layout,
});

function Layout() {
  return (
    <main className="mx-auto flex max-w-7xl items-center justify-center px-6 py-48">
      <Outlet />
    </main>
  );
}
