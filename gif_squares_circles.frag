#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy; // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5; // centers uv
    uv.x *= iResolution.x/iResolution.y; // scales uv correctly

    vec3 col = vec3(0);
    float cell_size = .2;

    vec2 gv = fract(uv/cell_size)-.5; // grid uv
    float d = length(gv);
    float n = 0.; // counts how many circles are overlapping

    float circle_radius = mix(.3, 1.5, .5*sin(iTime*2.+length(uv-gv*cell_size)*30.)+.5);

    float max_offset = floor(2.*circle_radius/cell_size + 1.);
    for (float i=-max_offset; i<max_offset; i++) {
        for (float j=-max_offset; j<max_offset; j++) {
            vec2 offs = vec2(i,j);
            float r = mix(.3, 1.7, .5*sin(iTime*2.+length(uv-(gv+offs)*cell_size)*30.)+.5);
            d = length(gv + offs);
            n += step(.1, smoothstep(r, r-.1, d));
        }
    }
    //col.rg = gv;
    //col += m*mod(n, 2.);
    col = vec3(mod(n,2.));

    gl_FragColor = vec4(col, 1.0);
}

