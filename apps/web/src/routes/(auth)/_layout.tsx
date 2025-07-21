import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives/Button";

export const Route = createFileRoute("/(auth)")({
  component: Layout,
});

export default function Layout() {
  return (
    <main className="relative mx-auto flex max-w-screen-xl items-center justify-center px-6 py-48">
      <nav className="absolute top-8 left-8">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft />
          </Link>
        </Button>
      </nav>
      <Outlet />
    </main>
  );
}
