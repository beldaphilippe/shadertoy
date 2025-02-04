#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

#define PI 3.14159265358979323846

float arg(vec2 v) {
    float theta = atan(v.y/v.x);
    if (v.x > 0.)
        return theta;
    else if (v.x < 0 && v.y > 0)
        return theta + PI;
    else
        return theta - PI;
}

// based on https://www.youtube.com/watch?v=cQXAbndD5CQ&list=PLGmrMu-IwbguU_nY2egTFmlg691DN7uE5&index=26
void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy; // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5; // centers uv
    uv.x *= iResolution.x/iResolution.y; // scales uv correctly

    uv *= 15.;

    vec3 col = vec3(0);

    vec2 gv = fract(uv)-.5; // grid uv
    vec3 m = vec3(0.); // add overlapping circles

    for (float i=-1.; i<=1.; i++) {
        for (float j=-1.; j<=1.; j++) {
            vec2 offs = vec2(i,j);

            float d = length(gv-offs);
            float dist = .3*length(uv-gv+offs);

            float r = mix(.3, 1.5, .5*sin(-iTime*2.+dist)+.5);
            float c = smoothstep(r, r*.9, d);
            m += vec3(c, 0, 0)*step(.1, c);
        }
    }
    //col.rg = gv;
    //col += m*mod(n, 2.);
    col = mod(m,2.) + vec3(0, arg(uv), .1*length(uv));

    gl_FragColor = vec4(col, 1.0);
}

