CC					= clang
SRCS   	 			= utils/shader-display/src/*
INCLUDE				= -Iutils/shader-display/include/
OUT  	 			= build/shader-display
LIBS	 			= -lGL -lglfw -lGLEW #-Iutils/external/glew-2.1.0/include
FLAGS	 			= #-Wall -Wextra -fsanitize=address,undefined
FLAGS_DEBUG			= -pg
FRAG_SHADER_PATH 	?= frag_shaders/test_shader.frag
VERT_SHADER_PATH    ?= vert_shaders/test_shader.vert
SHADER_PATH_FILE	= build/shader_path.h

all: compile

compile:
	mkdir -p build
	$(CC) $(FLAGS) -o $(OUT) $(SRCS) $(LIBS) $(INCLUDE)

debug:
	mkdir -p build
	$(CC) $(FLAGS_DEBUG) -o $(OUT) $(SRCS) $(LIBS) $(INCLUDE)

run:
	# nvidia-offload is to ask for gpu processing
	nvidia-offload ./build/shader-display $(VERT_SHADER_PATH) $(FRAG_SHADER_PATH)

test:
	mkdir -p build
	$(CC) $(FLAGS) -o $(OUT) $(SRCS) $(LIBS) $(INCLUDE)
	./build/shader-display $(VERT_SHADER_PATH) $(FRAG_SHADER_PATH)

clean:
	rm -r ./build

help:
	@echo -e 'Usage :\n\t make compile SHADER_PATH="<shader_path>"\n\t make run'
