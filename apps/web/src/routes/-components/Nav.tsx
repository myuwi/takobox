import { Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";

interface NavProps {
  user: null;
}

export default function Nav({ user }: NavProps) {
  return (
    <nav className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-6 py-4">
      <Link to="/" className="text-xl">
        Tako<span className="text-primary">box</span>
      </Link>
      <div className="flex items-center justify-end gap-4">
        {user ? (
          <>
            <span>Logged in as {user}</span>
            <Button variant="outline" asChild>
              <Link to="/">Log out</Link>
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
