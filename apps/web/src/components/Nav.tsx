import type { PropsWithChildren } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { logout } from "@/api/auth";
import { Button } from "@/components/primitives/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/DropdownMenu";
import { useMeQuery } from "@/queries/me";

const AccountDropdown = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    await navigate({
      to: "/",
      reloadDocument: true,
    });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleLogout()}
          >
            <LogOut />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface NavProps {
  menuButton?: React.ReactNode;
}

export const Nav = ({ menuButton }: NavProps) => {
  const { data: user } = useMeQuery();

  return (
    <nav className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-2">
        {menuButton}
        <Link to="/" className="text-xl">
          Tako<span className="text-primary">box</span>
        </Link>
      </div>
      <div className="flex items-center justify-end gap-4">
        {user ? (
          <AccountDropdown>
            <Button variant="ghost" className="data-[state=open]:bg-accent">
              <span>Logged in as {user.username}</span>
              <User />
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
};
