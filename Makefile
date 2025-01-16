SRCS  = pipeline_shader.c utils/shader.c
OUT   = shader_display
LIBS  = -lGLEW -lglfw -lGL
FLAGS = -Wall -Wextra -fsanitize=address,undefined

main: $(SRCS)
	gcc $(FLAGS) -o $(OUT) $(SRCS) $(LIBS)

run:
	./shader_display
