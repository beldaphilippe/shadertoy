main:
	gcc pipeline_shader.c -Wall -Wextra -fsanitize=address,undefined

run:
	./a.out
