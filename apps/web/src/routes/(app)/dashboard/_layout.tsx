import { createFileRoute, Outlet } from "@tanstack/react-router";
import Nav from "../../-components/Nav";
import { Sidebar } from "./-components/Sidebar";

export const Route = createFileRoute("/(app)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full flex-col items-stretch">
      <Nav />
      <div className="mx-auto flex w-full max-w-screen-xl grow gap-4 px-6 py-4">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
}
