#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

// UTILS

#define PI 3.14159265358979323846

// CODE

float map(vec3 p);

float getDist(vec3 p);

vec3 getNormal(vec3 p) {
    float d = getDist(p).x;
    vec2 e = vec2(.01, 0);
    vec3 n = d - vec3(getDist(p-e.xyy).x,
                      getDist(p-e.yxy).x,
                      getDist(p-e.yyx).x);
    return normalize(n);
}

vec2 rayMarching(vec3 ro, vec3 rd) {
    vec2 dO = vec2(0); // dist and id of item hit
    for (int i=0; i<MAX_STEPS; i++) {
        vec3 p = ro + rd*dO.x;
        vec2 dS = getDist(p);
        dO.x += dS.x;
        dO.y = dS.y;
        if (dS.x<DIST_CONTACT) break;
        if (dO.x>MAX_DIST) {
            dO.y = -1.;
            break;
        }
    }
    return dO;
}

float getLight(vec3 p) {
    vec3 lo = vec3(0, 2, -5); // light origin
    //lo.xz += 2.*vec2(cos(iTime), sin(iTime));

    vec3 n = getNormal(p); // surface normal at point p
    vec3 l = normalize(lo-p); // light vector

    float dif = clamp(dot(n, l), 0., 1.); // dot product can be negative
    float d = RayMarching(p + n*DIST_CONTACT*2., l).x;
    if (d < length(lo-p)) dif *= .1; // cast shadow

    if (length(lo - p) < 1.) return 1.;

    return dif;
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy; // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5; // centers uv
    uv.x *= iResolution.x/iResolution.y; // scales uv correctly

    vec3 col = vec3(0);
    gl_FragColor = vec4(col, 1.0);
}
