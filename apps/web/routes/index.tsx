import Nav from "../components/Nav.tsx";

export default function Home() {
  const user = null;

  return (
    <>
      <Nav user={user} />
      <main class="flex flex-col gap-6 items-center py-48 px-4 mx-auto max-w-5xl">
        <h1 class="text-4xl text-center">
          A <span class="text-primary">simpler</span> file upload service
        </h1>
        <h2 class="text-base text-zinc-600">
          Lightweight, self-hostable and blazingly fast.
        </h2>
        <div class="flex flex-row gap-4">
          {user
            ? <a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
            : <a href="/signup" class="btn btn-primary">Get started</a>}
        </div>
      </main>
    </>
  );
}
