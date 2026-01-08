import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Menu, Search, X } from "lucide-react";
import { sidebarOpenMobileAtom } from "@/atoms/sidebar";
import { AccountMenu } from "@/components/AccountMenu";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Sidebar } from "@/components/Sidebar";
import { collectionsOptions } from "@/queries/collections";
import { meOptions } from "@/queries/me";

interface AppSearchParams {
  q?: string;
}

export const Route = createFileRoute("/(app)/(dashboard)")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(collectionsOptions);
  },
  validateSearch: (search: Record<string, unknown>): AppSearchParams => {
    return {
      q: search.q != null ? String(search.q) : undefined,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();

  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q);

  const { data: user } = useQuery(meOptions);

  const setSidebarOpen = useSetAtom(sidebarOpenMobileAtom);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleSearchChange = (val: string | undefined) => {
    setQuery(val);

    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        q: val ? val : undefined,
      }),
    });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-xl items-stretch overflow-hidden">
      <Sidebar />
      <div className="flex w-full flex-col">
        <nav className="flex w-full max-w-screen-xl items-center gap-4 p-4">
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
          <div className="flex grow items-center gap-4">
            <Input
              containerClassName="md:max-w-md"
              leadingIcon={<Search />}
              trailingIcon={
                !!query && (
                  <X
                    className="pointer-events-auto cursor-pointer transition-colors duration-200 hover:text-foreground"
                    onClick={() => handleSearchChange("")}
                  />
                )
              }
              placeholder="Search files..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
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
