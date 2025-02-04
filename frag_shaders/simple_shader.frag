#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds

void main(void) {
    vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    if (length(vec2(0) - uv) < 1.)
        gl_FragColor = vec4(1, iTime/10, 0, 1);
    else
        gl_FragColor = vec4(0, 1, 0, 1);
}
