#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "external/glew-2.1.0/include/GL/glew.h" // import glew
//#include <GL/glew.h>


char* readFile(const char* file_path);

GLuint LoadShaders(const char * vertex_file_path, const char * fragment_file_path);
