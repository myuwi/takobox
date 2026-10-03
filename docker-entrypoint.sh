#!/usr/bin/env bash

set -euo pipefail

mkdir -p "${TAKOBOX_DATA_DIR}"
chmod o-rwx "${TAKOBOX_DATA_DIR}"

/app/takobox &

su-exec web env -i \
  NO_COLOR=1 \
  TAKOBOX_INTERNAL_API_URL=http://127.0.0.1:8000/api \
  TAKOBOX_DISABLE_LANDING_PAGE="${TAKOBOX_DISABLE_LANDING_PAGE:-false}" \
  /usr/local/bin/bun /app/web/server/index.mjs &

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &

# When any process exits, stop the rest gracefully.
trap '' TERM INT
status=0
wait -n || status=$?
kill 0
wait
exit "${status}"
