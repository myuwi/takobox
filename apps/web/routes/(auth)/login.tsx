import { Head } from "$fresh/runtime.ts";
import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const body = Object.fromEntries(form);

    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(await res.text());

    if (!res.ok) {
      return ctx.render({
        errors: "Something went wrong",
      });
    }

    // TODO: set cookie and redirect
    return ctx.render();
  },
};

export default function Login() {
  return (
    <>
      <Head>
        <title>Log in to Takobox</title>
      </Head>
      <form class="flex flex-col gap-6 w-full max-w-xs" method="post">
        <h1 class="text-2xl">Log in</h1>
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-2">
            Username
            <input
              class="input"
              type="text"
              name="username"
              required
              autofocus
            />
          </label>
          <label class="flex flex-col gap-2">
            Password
            <input
              class="input"
              type="password"
              name="password"
              required
            />
          </label>
        </div>
        <button class="btn btn-primary" type="submit">Log in</button>
        <span class="text-center text-zinc-500">
          Don't have an account yet?{" "}
          <a class="hover:underline text-zinc-700" href="/signup">
            Create account
          </a>
        </span>
      </form>
    </>
  );
}
