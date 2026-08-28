import { useNavigate } from "@tanstack/react-router";
import { LogOut, UserIcon } from "lucide-react";
import type { User } from "@takobox/sdk";
import { client } from "@/api/client";
import { Button } from "@/components/primitives/Button";
import * as Menu from "@/components/primitives/Menu";
import { toastError } from "@/components/primitives/Toast";

interface AccountMenuProps {
  user: User;
}

export const AccountMenu = ({ user }: AccountMenuProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await client.auth.logout();
      await navigate({
        to: "/",
        reloadDocument: true,
      });
    } catch (err) {
      toastError("Couldn't log out", err);
    }
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
