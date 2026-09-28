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
            pkgs.bun
            rust
            pkgs.bacon
            pkgs.ffmpeg
            pkgs.nixfmt
            pkgs.sqlx-cli
          ];
        };

        e2e = pkgs.mkShell {
          packages = [ pkgs.bun ];
        };
      };
    };
}
