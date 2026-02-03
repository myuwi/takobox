FROM oven/bun:1.3.6-alpine AS base

FROM base AS builder
WORKDIR /app

# cache deps
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/openapi-client/package.json ./packages/openapi-client/
RUN bun i --frozen-lockfile

# build source
COPY apps/web ./apps/web
COPY packages/openapi-client/ ./packages/openapi-client
RUN bun --cwd=apps/web run build

# run the app
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.output ./

USER bun
EXPOSE 3000/tcp
CMD ["bun", "server/index.mjs"]
