import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserIcon } from "lucide-react";
import { logout } from "@/api/auth";
import { Button } from "@/components/primitives/Button";
import * as Menu from "@/components/primitives/Menu";
import { useMeQuery } from "@/queries/me";
import type { User } from "@/types/User";

interface AccountMenuProps {
  user: User;
}

const AccountMenu = ({ user }: AccountMenuProps) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    await navigate({
      to: "/",
      reloadDocument: true,
    });
  };

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        render={
          <Button variant="ghost" className="data-popup-open:bg-accent">
            <span>Logged in as {user.username}</span>
            <UserIcon />
          </Button>
        }
      />
      <Menu.Content className="w-48" align="end">
        <Menu.Group>
          <Menu.GroupLabel>My Account</Menu.GroupLabel>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group>
          <Menu.Item variant="destructive" onClick={() => handleLogout()}>
            <LogOut />
            <span>Log out</span>
          </Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
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
          <AccountMenu user={user} />
        ) : (
          <>
            <Button variant="ghost" render={<Link to="/login" />}>
              Log in
            </Button>
            <Button render={<Link to="/signup" />}>Sign up</Button>
          </>
        )}
      </div>
    </nav>
  );
};
