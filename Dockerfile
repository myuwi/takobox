FROM oven/bun:1.4.2-alpine AS bun

# Build web
FROM bun AS web-builder
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/sdk/package.json ./packages/sdk/
RUN bun i --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/sdk/ ./packages/sdk
RUN bun --cwd=apps/web run build

# Build backend
FROM rust:1.98.1-alpine3.24 AS backend-builder
WORKDIR /app

RUN apk add --no-cache \
    musl-dev \
    pkgconf

COPY ./apps/backend/Cargo.toml ./apps/backend/Cargo.lock ./
RUN mkdir src && \
    echo 'fn main() { panic!("You should not see this!") }' > src/main.rs && \
    cargo build --release && \
    rm -r src

COPY ./apps/backend ./
RUN touch src/main.rs
RUN cargo build --release

# Setup runner
FROM alpine:3.24 AS runner
RUN apk add --no-cache \
    bash \
    ca-certificates \
    caddy \
    ffmpeg \
    libgcc \
    libstdc++ \
    su-exec \
    tini

RUN adduser -S -H web

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY --from=backend-builder /app/target/release/takobox /app/takobox
COPY --from=web-builder /app/apps/web/.output /app/web
COPY Caddyfile /etc/caddy/Caddyfile
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV TAKOBOX_DATA_DIR=/takobox_data
ENV NO_COLOR=1
EXPOSE 80/tcp
ENTRYPOINT ["/sbin/tini", "-g", "--", "/usr/local/bin/docker-entrypoint.sh"]
