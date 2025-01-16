#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <GL/glew.h>

// Function to read shader code from a file
char* readFile(const char* file_path) {
    FILE* file = fopen(file_path, "r");
    if (!file) {
        printf("Failed to open file: %s\n", file_path);
        return NULL;
    }

    // Get file size
    fseek(file, 0, SEEK_END);
    long fileSize = ftell(file);
    rewind(file);

    // Allocate memory for the file content
    char* content = (char*)malloc((fileSize + 1) * sizeof(char));
    if (!content) {
        printf("Failed to allocate memory for shader file.\n");
        fclose(file);
        return NULL;
    }

    // Read file content
    fread(content, 1, fileSize, file);
    content[fileSize] = '\0'; // Null-terminate the string
    fclose(file);

    return content;
}

GLuint LoadShaders(const char * vertex_file_path, const char * fragment_file_path) {

	// Create the shaders
	GLuint VertexShaderID = glCreateShader(GL_VERTEX_SHADER);
	GLuint FragmentShaderID = glCreateShader(GL_FRAGMENT_SHADER);

	GLint Result = GL_FALSE;
	int InfoLogLength;

	// Read the Vertex Shader code from the file
	char* VertexShaderCode = readFile(vertex_file_path);

	// Compile Vertex Shader
	printf("Compiling shader : %s\n", vertex_file_path);
	glShaderSource(VertexShaderID, 1,(const char * const*)&VertexShaderCode , NULL);
	glCompileShader(VertexShaderID);

	// Check Vertex Shader
	glGetShaderiv(VertexShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(VertexShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if ( InfoLogLength > 0 ){
        char infoLog[512];
		glGetShaderInfoLog(VertexShaderID, 512, NULL, infoLog);
        fprintf(stderr, "ERROR::VERTEX_SHADER_LINKING_ERROR\n%s\n", infoLog);
	}
    free(VertexShaderCode);


	// Read the Fragment Shader code from the file
	char* FragmentShaderCode = readFile(fragment_file_path);

	// Compile Fragment Shader
	printf("Compiling shader : %s\n", fragment_file_path);
	glShaderSource(FragmentShaderID, 1, (const char * const*)&FragmentShaderCode , NULL);
	glCompileShader(FragmentShaderID);

	// Check Fragment Shader
	glGetShaderiv(FragmentShaderID, GL_COMPILE_STATUS, &Result);
	glGetShaderiv(FragmentShaderID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if ( InfoLogLength > 0 ){
        char infoLog[512];
		glGetShaderInfoLog(FragmentShaderID, 512, NULL, infoLog);
        fprintf(stderr, "ERROR::FRAGMENT_SHADER_LINKING_ERROR\n%s\n", infoLog);
	}
    free(FragmentShaderCode);


	// Link the program
	printf("Linking program\n");
	GLuint ProgramID = glCreateProgram();
	glAttachShader(ProgramID, VertexShaderID);
	glAttachShader(ProgramID, FragmentShaderID);
	glLinkProgram(ProgramID);

	// Check the program
	glGetProgramiv(ProgramID, GL_LINK_STATUS, &Result);
	glGetProgramiv(ProgramID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if ( InfoLogLength > 0 ){
        char infoLog[512];
		glGetProgramInfoLog(ProgramID, 512, NULL, infoLog);
        fprintf(stderr, "ERROR::PROGRAM_LINKING_ERROR\n%s\n", infoLog);
	}


	glDetachShader(ProgramID, VertexShaderID);
	glDetachShader(ProgramID, FragmentShaderID);

	glDeleteShader(VertexShaderID);
	glDeleteShader(FragmentShaderID);

	return ProgramID;
}
