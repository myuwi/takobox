# End-to-end tests

The end-to-end suite starts an isolated production build of Takobox behind Caddy. Its SQLite
database, uploads, and thumbnails live in a Docker volume that is removed before and after each
test run.

Running the suite locally requires Bun and Docker with the Compose plugin.

Run the following commands from the repository root.

Install the E2E dependencies and Chromium once:

```sh
bun run test:e2e:install
```

Run the suite:

```sh
bun run test:e2e
```

For interactive test development:

```sh
bun run test:e2e:ui
```

Set `TAKOBOX_E2E_BASE_URL` to run against an existing environment instead of starting the local
Compose stack. The suite does not create, reset, or clean up that external environment.
