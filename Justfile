@build: css
  cargo build

@build-release: css
  cargo build --release --verbose

@css:
  pnpm css

@watch:
  cargo watch -x run
