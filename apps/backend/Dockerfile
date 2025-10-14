FROM rust:alpine AS builder
WORKDIR /app

RUN apk add --no-cache \
    musl-dev \
    pkgconf \
    openssl-dev \
    openssl-libs-static

# cache deps
COPY ./apps/backend/Cargo.toml ./apps/backend/Cargo.lock ./
RUN mkdir src &&  \
    echo 'fn main() { panic!("You should not see this!") }' > src/main.rs && \
    cargo build --release && \
    rm -r src

# build source
COPY ./apps/backend ./
RUN touch src/main.rs
RUN cargo build --release

# run the app
FROM alpine:latest AS runner
RUN apk add --no-cache ca-certificates ffmpeg
COPY --from=builder /app/target/release/takobox ./

EXPOSE 8000/tcp
CMD ["./takobox"]
