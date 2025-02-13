#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

// UTILS

#define PI              3.14159265358979323846
#define PHI             1.61803398874989484820459
#define MAX_STEPS       100
#define FAR             80.
#define DIST_CONTACT    .01
#define CAST_SHADOWS    1
#define rot(a)          mat2( cos(a), -sin(a), sin(a), cos(a) )
#define rotpi2          mat2(0, -1, 1, 0)

// CODE

float N21(vec2 p) {
    return fract(sin(p.x*24. + p.y*605.)*4879.);
}

float gold_noise(in float x, in float seed){
       return fract(tan(distance(x*PHI, x)*seed)*x);
}

float gold_noise(in vec2 xy, in float seed){
       return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

float gold_noise(in vec3 xyz, in float seed){
       return fract(tan(distance(xyz*PHI, xyz)*seed)*xyz.x);
}

vec3 randCol(vec2 id) {
    float seed = 33.;
    return vec3(gold_noise(id, seed+0.1),  // r
                gold_noise(id, seed+0.2),  // g
                gold_noise(id, seed+0.3)); // b
}

float sdPlane(vec3 p) {
    return p.y;
}

float sdBox(vec3 p, vec3 b) {
    // b contains the dimensions of the box
    float radii = min(min(b.x, b.y), b.z)*.04; // rounds the box
    vec3 q = abs(p) - b + radii;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - radii;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdCylinder(vec3 p, float r) {
    float height = 4.;
    return (p.y > height) ? length(p.xz) - r : length(p-vec3(0,height,0));
}

vec3 transOP(vec3 p, vec3 d) {
    return p -d;
}

vec3 repOP(vec3 p, vec3 c) {
    // this operator replicates in spaces periodically
    // everything that is in the [0,c] x [0,c] x [0,c] box
    // if a coordinate of c is 0, then the replication is
    // not executed in the corresponding dimension

    p.x = (c.x > 0) ? mod(p.x, c.x) - c.x*.5 : p.x;
    p.y = (c.y > 0) ? mod(p.y, c.y) - c.y*.5 : p.y;
    p.z = (c.z > 0) ? mod(p.z, c.z) - c.z*.5 : p.z;
    return p;
}

vec3 twistOP(vec3 p, vec3 c) {
    // c is the point which the axis of twist goes though
    float nt = .2;  // number of turns
    float oh = 4.;  // object height
    p.xz = (p.xz-c.xz)*rot(nt*2*PI/oh * p.y) + c.xz;
    return p;
}

vec3 rotOP(vec3 p, vec3 c) {
    p.xz = (p.xz-c.xz)*rot(.7*iTime) + c.xz;
    return p;
}

bool is_cube(vec3 p) {
    vec3 id = floor(p/1.);
    float seed = 33.;
    if (gold_noise(id.xz, seed) < .5) return true;
    //if (gold_noise(id.xz, seed) < .5 && gold_noise(id.y, seed+.4)*smoothstep(3., 0., id.y)<.0001) return true;
    //if (gold_noise(id.x, seed+.1) < .5 && gold_noise(id.y, seed+.2)<.4) return true;
    //if (id.x < 0. && id.y < 0.) return true;
    return false;
}

float getDist(vec3 p)
{
    //vec2 id = p.xz - mod(p.xz, 5);
    vec2 id = floor(p.xz/1.);
    float r = N21(id);

    return (is_cube(p)) ? sdBox(repOP(p, vec3(1, 0, 1)), vec3(.5)) : .5;
    //return min(sdPlane(p), sdCylinder(repOP(p, vec3(5, 0, 5)), r));
    //return min(sdPlane(p), sdBox(repOP(p, vec3(5, 0, 5)), vec3(r, 4, r)));
    //return min(sdPlane(p), sdBox(rotOP(twistOP(repOP(p, vec3(5, 0, 5)), vec3(0)), vec3(0)), vec3(r, 4, r)));

    //return sdCylinder(twistOP(rotOP(repOP(p, vec3(5)), vec3(0)), vec3(0.1)), r);
    //return sdCylinder(rotOP(twistOP(repOP(p, vec3(5)), vec3(0.1)), vec3(0)), r);
    //return sdCylinder(twistOP(repOP(p, vec3(5)), vec3(0.1)), r);

    //return sdBox(rotOP(twistOP(repOP(p, vec3(5)), vec3(0)), vec3(0)), vec3(r, 4, r));
    //return sdBox(rotOP(twistOP(repOP(p, vec3(4))), vec3(0)), vec3(.5, 4, .5));
    //return sdBox(rotOP(transOP(p, vec3(2,-1,-1)), vec3(0)), vec3(1));
    //return sdSphere(transOP(p, vec3(8, -1, -1)), 2);
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
        dO += dS*.65; // very important to avoid artifacts (factor can be changed a bit)
        if (dS<DIST_CONTACT || dO>FAR) break;
    }
    return dO;
}

float getLight2(vec3 p) {
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

float getLight(vec3 p) {
    // TODO : implement phong reflection and specular lighting
    vec3 ld = normalize(vec3(1));                  // light direction
    vec3 n = getNormal(p);              // surface normal at point p

    // cast shadow
    if (CAST_SHADOWS == 1)
    if (rayMarching(p+2.*DIST_CONTACT*n, ld) < FAR) return .1;

    float diffuse = dot(n, ld); // diffuse component
    diffuse = mix(clamp(diffuse, 0., 1.), .5*diffuse+.5, .2) + 4.*smoothstep(.98, 1., diffuse); // diffuse and phong reflection
    float ambiant = .1;
    return max(1.2*diffuse, ambiant);
}

vec3 getCamera(vec2 uv, out vec3 pos_camera) {
    // Takes uv as a vector of the position on the screen
    // of the pixel rendered, between 0 and 1

    pos_camera = vec3(0, 6, 3);
    vec3 dir_camera = vec3(0, 0, -1);
    float dist_viewport = 2.;
    float width_viewport = 2.;
    float height_viewport = width_viewport * iResolution.y/iResolution.x;

    // Move camera with mouse
    vec2 m = iMouse.xy/iResolution.xy - 0.5;
    dir_camera = normalize(vec3(sin(4.*m.x), 6.*m.y, -cos(4.*m.x)));

    // Calculation of the ray from the camera corresponding to uv
    vec3 du = vec3(0);
    du.xz = vec2(dir_camera.x, dir_camera.z) * rotpi2;
    //du.xz = vec2(dir_camera.x, dir_camera.z) * rot(PI/2.);
    vec3 dv = cross(du, dir_camera);

    du = normalize(du) * width_viewport;
    dv = normalize(dv) * height_viewport;
    vec3 rd = normalize(dir_camera*dist_viewport + uv.x*du + uv.y*dv);

    return rd;
}

vec3 render(vec3 ro, vec3 rd) {

    vec3 sky = vec3(53, 81, 92)/100. - normalize(rd).y/4.;
    //vec3 planeCol = vec3(0, 1, 0);

    float dS = rayMarching(ro, rd); // dist to a surface, id of item hit
    vec3 p = ro + rd*dS;            // hit point
    float diff = getLight(p);

    vec3 planeCol = randCol(p.xz - mod(p.xz, 5)+3.);

    //return mix(getNormal(p)*.5+.5, sky, smoothstep(FAR*.5, FAR, dS));
    //return mix(planeCol, sky, smoothstep(FAR*.5, FAR, dS));
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
