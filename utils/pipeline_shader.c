#include "external/glew-2.1.0/include/GL/glew.h"
#include "external/glfw-3.4/include/GLFW/glfw3.h"

/*#include <GL/glew.h>*/
/*#include <GLFW/glfw3.h>*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "shader.h"
#include "../build/shader_path.h"

#define VERT_SHADER_PATH "simple_shader.vert"
/*#define FRAG_SHADER_PATH "frag_shaders/deformations.frag"*/
/*#define FRAG_SHADER_PATH "aa.frag"*/

int main() {
    if (!glfwInit()) {
        printf("Failed to initialize GLFW\n");
        return -1;
    }

    // Set OpenGL version to 3.3 Core Profile
	glfwWindowHint(GLFW_SAMPLES, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(800, 600, "shader exp", NULL, NULL);
    if (!window) {
        printf("Failed to create GLFW window\n");
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

    // Initialize GLEW
    glewExperimental = GL_TRUE;
    if (glewInit() != GLEW_OK) {
        printf("Failed to initialize GLEW\n");
        return -1;
    }

	// Ensure we can capture the escape key being pressed below
	glfwSetInputMode(window, GLFW_STICKY_KEYS, GL_TRUE);
    // Hide the mouse and enable unlimited mouvement
    /*glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);*/

    // Vertex data
    float vertices[] = {
        -1.0f, -1.0f, 0.0f,
         1.0f, -1.0f, 0.0f,
        -1.0f,  1.0f, 0.0f,
         1.0f,  1.0f, 0.0f
    };
    unsigned int indices[] = { 0, 1, 2, 1, 3, 2 };

    GLuint VAO, VBO, EBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    glBindVertexArray(VAO);

    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);


	// Create and compile our GLSL program from the shaders
	GLuint programID = LoadShaders(VERT_SHADER_PATH, FRAG_SHADER_PATH);

    // Declare parameters later given to shaders
    GLuint u_resolutionID = glGetUniformLocation(programID, "iResolution");
    GLuint u_mouseID = glGetUniformLocation(programID, "iMouse");
    GLuint u_timeID = glGetUniformLocation(programID, "iTime");
    /*GLuint u_posCameraID = glGetUniformLocation(programID, "iPosCamera");*/
    /*GLuint u_dirCameraID = glGetUniformLocation(programID, "iDirCamera");*/
    /*GLuint u_cameraThetaID = glGetUniformLocation(programID, "iCameraTheta");*/
    /*GLuint u_cameraPhiID = glGetUniformLocation(programID, "iCameraPhi");*/

    // Window management
    int windowWidth, windowHeight;
    glfwGetWindowSize(window, &windowWidth, &windowHeight);
    glfwSetCursorPos(window, windowWidth/2, windowHeight/2);

    // Mouse
    double x_mouse, y_mouse;

    // For speed computation
	double lastTime = glfwGetTime();
	int nbFrames = 0;

    // Main Render Loop
    do {

		// Measure speed
		double currentTime = glfwGetTime();
		nbFrames++;
		if ( currentTime - lastTime >= 1.0 ){ // If last prinf() was more than 1sec ago
			// printf and reset
			fprintf(stdout, "\r%f ms/frame", 1000.0/(double)nbFrames);
            fflush(stdout);
			nbFrames = 0;
			lastTime += 1.0;
		}

        glClear(GL_COLOR_BUFFER_BIT);
        glUseProgram(programID);

        // Dynamic window size
        glfwGetWindowSize(window, &windowWidth, &windowHeight);
        glViewport(0, 0, windowWidth, windowHeight);

        // Shader parameters
        glfwGetCursorPos(window, &x_mouse, &y_mouse);

        glUniform2f(u_mouseID, x_mouse, windowHeight - y_mouse);
        glUniform1f(u_timeID, (float)glfwGetTime());
        glUniform2f(u_resolutionID,  (float)windowWidth, (float)windowHeight);

        glBindVertexArray(VAO);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }
	while( glfwGetKey(window, GLFW_KEY_ESCAPE ) != GLFW_PRESS &&
		   glfwWindowShouldClose(window) == 0 );

    // Cleanup
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);
    glDeleteProgram(programID);

    glfwTerminate();
    return 0;
}
