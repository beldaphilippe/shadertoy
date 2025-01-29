#!/bin/sh

if [ $# -eq 0 ]
  then
    echo "Usage :
    opengl -> shadertoy : gl2shadertoy -o <file>
    shadertoy -> opengl : gl2shadertoy -s <file>"

else if [ $1 = "-s" ]; then
    echo "#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;
"
    cat "$2" | sed -E 's/mainImage\(.*\)/main(void)/g' | sed -E 's/fragCoord/gl_FragCoord.xy/g' | sed -E 's/fragColor/gl_FragColor/g'

else if [ $1 = "-o" ]; then
    cat "$2" | grep -vE "#version.*core|^uniform.*i" | sed -E 's/main\(void\)/mainImage(out vec4 fragColor, in vec2 fragCoord)/g' | sed -E 's/gl_FragCoord/fragCoord/g' | sed -E 's/gl_FragColor/fragColor/g'

else
    echo "Usage :
    opengl -> shadertoy : gl2shadertoy -o <file>
    shadertoy -> opengl : gl2shadertoy -s <file>"
fi
fi
fi

