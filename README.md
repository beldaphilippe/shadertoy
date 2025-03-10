# My experimentations around fragment shaders

This repository is made to experiment around fragment shaders in GLSL. I particularly focused on raymarching and the different way of using the signed distance function to render some interesting forms/landscapes.

I was introduced to fragment shaders through the website shadertoy.com, so i also made a file to export a fragment shader to the format of Shadertoy and vice-versa.

# Usage

* clone the repository with `git clone git@github.com:beldaphilippe/shadertoy.git`
* cd to the main folder and call `make compile SHADER_PATH=frag_shaders\<name_of_shader> && make run`

## Note 

As I did not include all libraries to run opengl, you must have to some extent a basic installation of OpenGL to run the shaders.

# Sources

https://alexandre-laurent.developpez.com/tutoriels/OpenGL/OpenGL-GLSL/
https://waelyasmina.net/articles/glsl-and-shaders-tutorial-for-beginners-webgl-threejs/
https://learnopengl.com/getting-started/shaders
http://sdz.tdct.org/sdz/les-shaders-en-glsl.html
