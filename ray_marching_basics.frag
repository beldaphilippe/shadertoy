#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

// UTILS
#define PI 3.14159265358979323846
#define DIST_CONTACT 0.01
#define MAX_STEPS 1000
#define MAX_DIST 100.
#define MAX_REFL 2

#define rot(a)      mat2( cos(a), -sin(a), sin(a), cos(a) )

// CODE

// 0. for no grid, else size of the mesh (float)
#define GRID 0.

float sdSphere(vec3 p, vec3 center, float radius) {
    return length(p-center) - radius;
}

float sdPlane(vec3 p, vec3 center, vec3 normal) {
    //return dot(p - center, normal)-0.1;
    return clamp(abs(dot(p - center, normal))-0.1, 0., 1.);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float radius) {
    float t = clamp(dot(b-a, p-a)/dot(b-a, b-a), 0., 1.);
    vec3 c = a + t*(b-a);
    return length(p-c) - radius;
}

float sdTorus(vec3 p, vec3 center, float r1, float r2) {
    // r1 is the radius of the inner circle,
    // r2 is the width radius
    float y = p.y-center.y;
    float x = length(vec3(p.x, center.y, p.z) - center)-r1;
    return sqrt(x*x + y*y) - r2;
}

float dBox(vec3 p, vec3 center, vec3 s) {
    return length(max(abs(p-center)- s, 0.));
}


const int n = 6; // number of elements in universe
                     //
vec4 getColor(int id) {
    // Materials
    // color, depth of reflection
    vec4 mat[n] = vec4[] ( vec4(1,0,0, 1),
                           vec4(0,1,0, 0),
                           vec4(0,1,0, 1),
                           vec4(1,1,0, 0),
                           vec4(0,0,1, 0),
                           vec4(1,0,1, 1));
    return mat[id];
}

vec2 getDist(vec3 p) {
    // Universe
    float d_all[n] = float[] (sdSphere(p, vec3(0,1,-5), .5),
                              sdPlane(p, vec3(0, 0, 0), vec3(0, 1, 0)),
                              sdPlane(p, vec3(-4, 0, 0), vec3(-1, 0, 0)),
                              sdCapsule(p, vec3(-1, 1, -5), vec3(-1, 2, -5), .5),
                              sdTorus(p, vec3(1.5, 1, -5), .7, .3),
                              dBox(p, vec3(3, 1, -5), vec3(1)));

        // get the minimal distance
    float d = d_all[0];
    int id = 0;
    for (int i=1; i<n; i++) {
        if (d > d_all[i]) {
            d = d_all[i];
            id = i;
        }
    }
    return vec2(d, id);
}

vec3 getNormal(vec3 p) {
    float d = getDist(p).x;
    vec2 e = vec2(.01, 0);
    vec3 n = d - vec3(getDist(p-e.xyy).x,
                      getDist(p-e.yxy).x,
                      getDist(p-e.yyx).x);
    return normalize(n);
}

vec2 RayMarching(vec3 ro, vec3 rd) {
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
    vec3 lo = vec3(0, 10, -5); // light origin
    lo.xz += 2.*vec2(cos(iTime), sin(iTime));

    vec3 n = getNormal(p); // surface normal at point p
    vec3 l = normalize(lo-p); // light vector

    float dif = clamp(dot(n, l), 0., 1.); // dot product can be negative
    float d = RayMarching(p + n*DIST_CONTACT*2., l).x;
    if (d < length(lo-p)) dif *= .1; // cast shadow

    //if (length(lo - p) < 1.) return 1.;

    return dif;
}

vec3 Render(vec3 rd, vec3 ro) {
    // returns the color of pixel rendered
    // by ray of direction rd from origin ro

    vec2 dS = RayMarching(ro, rd); // dist to a surface, id of item hit
    if (int(dS.y) == -1) // out of rendered distance, sky
        return vec3(53, 81, 92)/100. - normalize(rd).y/4.;

    // an object has been hit
    vec3 p = ro + rd*dS.x; // hit point
    vec4 col_info = getColor(int(dS.y));
    vec3 col = col_info.xyz;
    float dif = getLight(p);
    bool refl = bool(col_info.w);
    int n_refl = 0;

    while (refl && n_refl<MAX_REFL) { // iterate on reflection and while ray doesnt go over rendered dist
        // calculus of reflected ray
        vec3 n = getNormal(p);
        rd = rd - 2.*dot(rd, n)*n; // reflected ray
        dS = RayMarching(p + 2.*DIST_CONTACT*n, rd); // dist to a surface, id of item hit
        if (int(dS.y) == -1) { // out of rendered distance, sky
            col =  vec3(53, 81, 92)/100. - normalize(rd).y/4.;
            break;
        }

        // an object has been hit
        col_info = getColor(int(dS.y));
        col = col_info.xyz;
        refl = bool(col_info.w);
        n_refl++;
        p = p + rd*dS.x; // hit point
        dif = getLight(p);
    }
    return col*dif;
}

vec3 getCamera(vec2 uv, out vec3 pos_camera) {
    // Takes uv as a vector of the position on the screen
    // of the pixel rendered, between 0 and 1

    pos_camera = vec3(0, 3, 1);
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

void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy; // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5; // centers uv
    // uv.x *= iResolution.x/iResolution.y; // scales uv correctly

    // calculate camera and ray direction
    vec3 pos_camera;
    vec3 rd = getCamera(uv, pos_camera);

    vec3 col = Render(rd, pos_camera);

    gl_FragColor = vec4(col, 1.0);
}
