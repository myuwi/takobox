import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/primitives/Button";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: user } = useQuery(meOptions);

  return (
    <>
      <Nav />
      <main className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-48">
        <h1 className="text-center text-4xl">
          A <span className="text-primary">simpler</span> file upload service
        </h1>
        <h2 className="text-base text-zinc-600">
          Lightweight, self-hostable and blazingly fast.
        </h2>
        <div className="flex flex-row gap-4">
          {user ? (
            <Button render={<Link to="/home" />}>Open Takobox</Button>
          ) : (
            <Button render={<Link to="/signup" />}>Get started</Button>
          )}
        </div>
      </main>
    </>
  );
}
