import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/primitives/Button";
import { meOptions } from "@/queries/me";
import { settingsOptions } from "@/queries/settings";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";

export const Nav = () => {
  const { data: settings } = useQuery(settingsOptions);
  const { data: user } = useQuery(meOptions);

  return (
    <nav className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-2">
        <Link to="/">
          <Logo />
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
            {settings?.enableAccountCreation && (
              <Button render={<Link to="/signup" />}>Sign up</Button>
            )}
          </>
        )}
      </div>
    </nav>
  );
};
