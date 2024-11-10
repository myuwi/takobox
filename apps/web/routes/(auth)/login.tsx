import { Head } from "$fresh/runtime.ts";

export default function Login() {
  return (
    <>
      <Head>
        <title>Log in to Takobox</title>
      </Head>
      <form class="flex flex-col gap-6 w-full max-w-xs">
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
