import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import Nav from "./-components/Nav";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const user = null;

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-48">
        <h1 className="text-center text-4xl">
          A <span className="text-primary">simpler</span> file upload service
        </h1>
        <h2 className="text-base text-zinc-600">
          Lightweight, self-hostable and blazingly fast.
        </h2>
        <div className="flex flex-row gap-4">
          {user ? (
            <Button asChild>
              <Link to="/">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/sign-up">Get started</Link>
            </Button>
          )}
        </div>
      </main>
    </>
  );
}
