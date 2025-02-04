#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

// COMMENTARY

// A ground plane in height y=0, cut in hexagons
// that move up and down

// UTILS
#define PI 3.14159265358979323846
#define DIST_CONTACT 0.01
#define MAX_STEPS 500
#define MAX_DIST 100.
#define MAX_REFL 2

#define rot(a)      mat2( cos(a), -sin(a), sin(a), cos(a) )

// CODE

// 0. for no grid, else size of the mesh (float)
#define GRID 0.

float mabs(float x) {
    if (x < 0.) return -x;
    return x;
}

float N21(vec2 p) {
    return fract(sin(p.x*24. + p.y*605.)*4879.);
}

vec4 hexCoords(vec2 pc) {
    vec2 r = vec2(1., 1.73);        // dimensions of grid cell
    vec2 h = r/2.;
    vec2 ga = mod(pc, r) - h;       // grid a
    vec2 gb = mod(pc - h, r) - h;   // grid b

    vec2 gc = dot(ga,ga)<dot(gb,gb) ? ga : gb;
    return vec4(gc, pc-gc);
}

float mapHeight(vec3 p) {
    return N21(hexCoords(p.xz).zw);
}

float sdMap(vec3 p) {
    int N = 10;               // sqrt of cardinal of sample of points to find the minima
    float dg = mapHeight(p); // dist to the ground directly below
    float dmin = p.y - dg;   // minimal dist to sample points
    for (int i=0; i<N; i++)
    for (int j=0; j<N; j++) {
        vec3 pos;            // position of the sample point on terrain
        pos.xz = p.xz + vec2(dg*2.*float(i)/float(N), dg*2.*float(j)/float(N)) - dg;
        pos.y = mapHeight(pos);
        dmin = min(length(p - pos), dmin);
    }
    return dmin;
}

float sdHexPrism( vec3 p, vec2 h )
{
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
  vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float hexPylon(vec3 p) {
    vec2 center = vec2(0, -5);
    float height = 2.;
    return 0.;
}

float getDist(vec3 p) {
    //return sdMap(p);
    return sdHexPrism(p, vec2(3, 6));
}

float RayMarching(vec3 ro, vec3 rd) {
    float dO = 0.;
    for (int i=0; i<MAX_STEPS; i++) {
        vec3 p = ro + rd*dO;
        float dS = getDist(p);
        dO += dS;
        if (dS<DIST_CONTACT) break;
        if (dO>MAX_DIST) break;
    }
    return dO;
}

vec3 getNormal(vec3 p) {
  float d = getDist(p);
  vec2 e = vec2(.01, 0);
  vec3 n = d - vec3(getDist(p-e.xyy),
                    getDist(p-e.yxy),
                    getDist(p-e.yyx));
  return normalize(n);
}

vec3 Render(vec3 rd, vec3 ro) {
    float dS = RayMarching(ro, rd); // dist to a surface
    if (dS > MAX_DIST)              // out of rendered distance, sky
        return vec3(53, 81, 92)/100. - normalize(rd).y/4.;
    //vec2 pc = (ro + rd*dS).xz;      // coordinates on ground plane (plane coordinates)
    //return vec3(dS/100.);
    //return getNormal(ro+dS*rd);
    vec2 id = hexCoords((ro+rd*dS).xz).zw;
    return vec3(mod(id.x, 2.));
    }


vec3 getCamera(vec2 uv, out vec3 pos_camera) {
    // Takes uv as a vector of the position on the screen
    // of the pixel rendered, between 0 and 1

    pos_camera = vec3(0, 5, 1);
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
