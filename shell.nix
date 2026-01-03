# save this as shell.nix
{ pkgs ? import <nixpkgs> {} }: with pkgs;
mkShell {
  buildInputs = [
    glew
    glfw
    xorg.libX11
  ];

  shellHook = ''
    echo "Loaded shaders shell"
  '';
}
