import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Takobox</title>
        <link href="/styles.css" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <noscript class="flex items-center py-3 px-4 text-white bg-rose-400">
          Please enable JavaScript in your browser's settings.
        </noscript>
        {/* Fix Firefox FOUC when DevTools are open */}
        <script>0</script>
        <Component />
      </body>
    </html>
  );
}
