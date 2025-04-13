import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { useMeQuery } from "@/queries/me";
import { logout } from "@/utils/session";

export default function Nav() {
  const { data: user, isLoading } = useMeQuery();

  const handleLogout = useServerFn(logout);

  return (
    <nav className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-6 py-4">
      <Link to="/" className="text-xl">
        Tako<span className="text-primary">box</span>
      </Link>
      <div className="flex items-center justify-end gap-4">
        {user || isLoading ? (
          <>
            {user ? (
              <span>Logged in as {user.username}</span>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
            <Button onClick={() => handleLogout()} variant="outline">
              Log out
            </Button>
          </>
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
