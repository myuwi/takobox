{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      # `@playwright/test` in e2e/package.json must stay pinned to `pkgs.playwright-driver.version`
      playwrightEnv = {
        PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers.override {
          withFirefox = false;
          withWebkit = false;
          withFfmpeg = false;
        }}";
        PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
      };
    in
    {
      formatter.${system} = pkgs.nixfmt-tree;

      devShells.${system} = {
        default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.cargo
            pkgs.rustc
            pkgs.clippy
            pkgs.rust-analyzer
            # rustfmt.toml uses nightly-only options
            (pkgs.rustfmt.override { asNightly = true; })
            pkgs.bacon
            pkgs.ffmpeg-headless
            pkgs.nixfmt
            pkgs.sqlx-cli
          ];

          env = playwrightEnv // {
            RUST_SRC_PATH = "${pkgs.rustPlatform.rustLibSrc}";
          };
        };

        e2e = pkgs.mkShell {
          packages = [ pkgs.bun ];
          env = playwrightEnv;
        };
      };
    };
}
