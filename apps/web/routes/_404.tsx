import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <main class="flex justify-center items-center py-48 px-6">
        <div class="flex flex-col items-center">
          <h1 class="text-2xl">404 - Page not found</h1>
          <p class="my-4">
            The page you were looking for doesn't exist.
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </main>
    </>
  );
}
