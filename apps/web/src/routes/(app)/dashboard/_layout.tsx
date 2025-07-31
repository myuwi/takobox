import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Menu } from "lucide-react";
import { sidebarOpenMobileAtom } from "@/atoms/sidebar";
import { Button } from "@/components/primitives/Button";
import Nav from "../../-components/Nav";
import { Sidebar } from "./-components/Sidebar";

export const Route = createFileRoute("/(app)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const setSidebarOpen = useSetAtom(sidebarOpenMobileAtom);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-full w-full flex-col items-stretch">
      <Nav
        menuButton={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
        }
      />
      <div className="mx-auto flex w-full max-w-screen-xl grow gap-4 overflow-hidden p-4">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
}
