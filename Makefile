SRCS   	 = utils/pipeline_shader.c utils/shader.c
SRCS_EXT = utils/external/glew-1.13.0/src/glew.c utils/external/glfw-3.1.2/include/GLFW/glfw3.h
OUT  	 = shader_display
LIBS	 = -lGL -lglfw #-lGLEW
FLAGS	 = -Wall -Wextra -fsanitize=address,undefined

main: $(SRCS)
	gcc $(FLAGS) -o $(OUT) $(SRCS) $(SRCS_EXT) $(LIBS)

run:
	./shader_display
