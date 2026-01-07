import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Menu } from "lucide-react";
import { sidebarOpenMobileAtom } from "@/atoms/sidebar";
import { AccountMenu } from "@/components/AccountMenu";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/primitives/Button";
import { Sidebar } from "@/components/Sidebar";
import { collectionsOptions } from "@/queries/collections";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/(app)/(dashboard)")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(collectionsOptions);
  },
});

function RouteComponent() {
  const { data: user } = useQuery(meOptions);

  const setSidebarOpen = useSetAtom(sidebarOpenMobileAtom);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-xl items-stretch gap-4 overflow-hidden px-4">
      <Sidebar />
      <div className="flex w-full flex-col pb-4">
        <nav className="mx-auto flex w-full max-w-screen-xl items-center gap-4 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <AccountMenu user={user!} />
          </div>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
