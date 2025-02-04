#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

// UTILS

#define PI              3.14159265358979323846
#define MAX_STEPS       100
#define FAR             100.
#define DIST_CONTACT    .01
#define rot(a)          mat2( cos(a), -sin(a), sin(a), cos(a) )

// CODE

float mabs(float x) {
    return (x>0) ? x : -x;
}

float sdBox(vec3 p) {
    vec3 c = vec3(0, 1, -6);
    float a = 1.;
    p.xy = mod(p.xy, 2.) - vec2(1,0);
    //p = mod(p, 2.) - vec3(1,0,1);
    //p.z = mod(p.z, 5.)+1.5;
    //p.z += -5.;
    //p = mod(p, 2.) - vec3(1.);
    return length(p-c) - a/2.;
    //return length(p-c) - a/2.* mabs((p.x - c.x)/(p.z - c.z));
}

float sdSphere(vec3 p) {
    float a = .5;
    vec3 c = vec3(0, 1, -1);

    //p = mod(p, rep) - vec3(rep/2.,0,0);
    //p.z = - p.z;
    return length(p-c) - a/2.;
}

vec3 repOP(vec3 p, float c) {
    p = mod(p, c) - vec3(c/2., 0, 0);
    p.z = - p.z;
    return p;
}

float getDist(vec3 p) {
    return sdSphere(repOP(p, 3.));
}

vec3 getNormal(vec3 p) {
    float d = getDist(p);
    vec2 e = vec2(.01, 0);
    vec3 n = d - vec3(getDist(p-e.xyy),
                      getDist(p-e.yxy),
                      getDist(p-e.yyx));
    return normalize(n);
}

float rayMarching(vec3 ro, vec3 rd) {
    float dO = 0.; // dist of item hit
    for (int i=0; i<MAX_STEPS; i++) {
        vec3 p = ro + rd*dO;
        float dS = getDist(p);
        dO += dS;
        if (dS<DIST_CONTACT) break;
        if (dO>FAR) break;
    }
    return dO;
}

float getLight(vec3 p) {
    vec3 lo = vec3(0, 3, 0); // light origin
    //lo.xz += 2.*vec2(cos(iTime), sin(iTime));

    vec3 n = getNormal(p); // surface normal at point p
    vec3 l = normalize(lo-p); // light vector

    float diff = clamp(dot(n, l), 0., 1.); // dot product can be negative
    //float diff = smoothstep(0., 1., .5*dot(n, l) + .5); // dot product can be negative
    float d = rayMarching(p + n*DIST_CONTACT*2., l);
    if (d < length(lo-p)) diff = .1;                    // cast shadow

    //if (length(lo - p) < 1.) return 1.;

    return diff;
}

vec3 getCamera(vec2 uv, out vec3 pos_camera) {
    // Takes uv as a vector of the position on the screen
    // of the pixel rendered, between 0 and 1

    pos_camera = vec3(0, 3, 0);
    vec3 dir_camera = vec3(0, 0, -1);
    float dist_viewport = 2.;
    float width_viewport = 2.;
    float height_viewport = width_viewport * iResolution.y/iResolution.x;

    // Move camera with mouse
    vec2 m = iMouse.xy/iResolution.xy - 0.5;
    dir_camera = normalize(vec3(sin(4.*m.x), 6.*m.y, -cos(4.*m.x)));
    dir_camera = dir_camera/length(dir_camera);

    // Calculation of the ray from the camera corresponding to uv
    vec3 du = vec3(0);
    du.xz = vec2(dir_camera.x, dir_camera.z) * rot(PI/2.);
    vec3 dv = cross(du, dir_camera);

    du = normalize(du) * width_viewport;
    dv = normalize(dv) * height_viewport;
    vec3 rd = normalize(dir_camera*dist_viewport + uv.x*du + uv.y*dv);

    return rd;
}

vec3 render(vec3 ro, vec3 rd) {

    float dS = rayMarching(ro, rd); // dist to a surface, id of item hit
    vec3 sky = vec3(53, 81, 92)/100. - normalize(rd).y/4.;

    //if (dS > FAR)                   // out of rendered distance, sky
        //return sky;

    // an object has been hit
    vec3 p = ro + rd*dS; // hit point
    vec3 planeCol = vec3(0, 1, 0);
    float diff = getLight(p);

    //return mix(getNormal(p) * diff, sky, smoothstep(FAR*.5, FAR, dS));
    return mix(planeCol * diff, sky, smoothstep(FAR*.5, FAR, dS));
}

void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy; // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5; // centers uv

    vec3 pos_camera;
    vec3 rd = getCamera(uv, pos_camera);
    vec3 col = render(pos_camera, rd);
    gl_FragColor = vec4(col, 1.0);
}
