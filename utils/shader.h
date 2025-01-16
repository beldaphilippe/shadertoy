#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <GL/glew.h>

char* readFile(const char* file_path);

GLuint LoadShaders(const char * vertex_file_path, const char * fragment_file_path);
