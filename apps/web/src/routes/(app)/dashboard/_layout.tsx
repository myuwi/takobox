import { createFileRoute, Outlet } from "@tanstack/react-router";
import Nav from "../../-components/Nav";
import { Sidebar } from "./-components/Sidebar";

export const Route = createFileRoute("/(app)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-screen-xl gap-10 px-6 py-4">
        <Sidebar />
        <main className="w-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    </>
  );
}
