import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/(auth)")({
  component: Layout,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(meOptions);
    if (user) {
      throw redirect({ to: "/home" });
    }
  },
});

export default function Layout() {
  return (
    <main className="relative mx-auto flex max-w-screen-xl items-center justify-center px-6 py-48">
      <nav className="absolute top-8 left-8">
        <Button variant="ghost" size="icon" render={<Link to="/" />}>
          <ArrowLeft />
        </Button>
      </nav>
      <Outlet />
    </main>
  );
}
