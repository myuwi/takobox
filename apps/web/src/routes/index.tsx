import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/primitives/Button";
import { meOptions } from "@/queries/me";

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(meOptions);
    if (user) {
      throw redirect({ to: "/home" });
    }

    if (import.meta.env.TAKOBOX_DISABLE_LANDING_PAGE) {
      throw redirect({ to: "/login" });
    }
  },
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
