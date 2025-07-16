import type { PropsWithChildren } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu";
import { useMeQuery } from "@/queries/me";
import { logout } from "@/utils/session";

function AccountDropdown({ children }: PropsWithChildren) {
  const handleLogout = useServerFn(logout);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem danger onClick={() => handleLogout()}>
            <LogOut />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Nav() {
  const { data: user } = useMeQuery();

  return (
    <nav className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-6 py-4">
      <Link to="/" className="text-xl">
        Tako<span className="text-primary">box</span>
      </Link>
      <div className="flex items-center justify-end gap-4">
        {user ? (
          <AccountDropdown>
            <Button variant="ghost">
              <span>Logged in as {user.username}</span>
              <User size={20} />
            </Button>
          </AccountDropdown>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
