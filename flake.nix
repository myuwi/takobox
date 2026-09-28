{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
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

          RUST_SRC_PATH = "${pkgs.rustPlatform.rustLibSrc}";
        };

        e2e = pkgs.mkShell {
          packages = [ pkgs.bun ];
        };
      };
    };
}
