SRCS   	 			= utils/pipeline_shader.c utils/shader.c
SRCS_EXT 			= utils/external/glew-2.1.0/src/glew.c
OUT  	 			= build/shader_display
LIBS	 			= -Iutils/external/glew-2.1.0/include -lGL -lglfw #-lGLEW
FLAGS	 			= #-Wall -Wextra -fsanitize=address,undefined
SHADER_PATH 	   ?= frag_shaders/simple_shader.frag
SHADER_PATH_FILE	= build/shader_path.h

all: compile

compile: $(SRCS)
	mkdir -p build
	echo "#define FRAG_SHADER_PATH \"$(SHADER_PATH)\"" > $(SHADER_PATH_FILE)
	gcc $(FLAGS) -o $(OUT) $(SRCS) $(SHADER_PATH_FILE) $(SRCS_EXT) $(LIBS)

run:
	./build/shader_display

test:
	mkdir -p build
	echo "#define FRAG_SHADER_PATH \"frag_shaders/simple_shader.frag\"" > $(SHADER_PATH_FILE)
	gcc $(FLAGS) -o $(OUT) $(SRCS) $(SHADER_PATH_FILE) $(SRCS_EXT) $(LIBS)
	./build/shader_display

clean:
	rm -r ./build
