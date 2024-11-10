import { PageProps } from "$fresh/server.ts";
import { ArrowLeft } from "lucide-preact";

export default function Layout({ Component }: PageProps) {
  return (
    <main class="flex relative justify-center items-center py-48 px-6 mx-auto max-w-screen-xl">
      <a class="absolute top-8 left-8 btn btn-square btn-ghost" href="/">
        <ArrowLeft />
      </a>
      <Component />
    </main>
  );
}
