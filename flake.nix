{
  inputs = {
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, fenix, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      fenixPkgs = fenix.packages.${system};

      bun = pkgs.bun.overrideAttrs (
        finalAttrs: _: {
          version = "1.4.0";
          src = pkgs.fetchurl {
            url = "https://github.com/oven-sh/bun/releases/download/bun-v${finalAttrs.version}/bun-linux-x64-baseline.zip";
            hash = "sha256-GE+0WV8NQBohfPfHjBvEMLqDMU2reouUgFurv3+nCX8=";
          };
        }
      );

      rust = fenixPkgs.combine [
        (fenixPkgs.stable.withComponents [
          "cargo"
          "rustc"
          "rust-std"
          "clippy"
          "rust-analyzer"
          "rust-src"
        ])
        fenixPkgs.default.rustfmt
      ];
    in
    {
      formatter.${system} = pkgs.nixfmt-tree;

      devShells.${system} = {
        default = pkgs.mkShell {
          packages = [
            bun
            rust
            pkgs.bacon
            pkgs.ffmpeg
            pkgs.nixfmt
            pkgs.sqlx-cli
          ];
        };

        e2e = pkgs.mkShell {
          packages = [ bun ];
        };
      };
    };
}
