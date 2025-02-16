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
float scale(float a, float b, float A, float B, float x) { return A + (x-a)/(b-a) * (B-A); }

// CODE

float N21(vec2 p) {
    return fract(sin(p.x*24. + p.y*605.)*4879.);
}

float gold_noise(in vec2 xy, in float seed){
       return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

float hash12(vec2 p) {
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash( in vec2 x )   // this hash is not production ready, please
{                        // replace this by something better
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

//float hash(vec2 uv) {
    //return fract(sin(dot(uv, vec2(73211.171, 841.13))) * 32131.18128);
//}

float noise(vec2 uv) {
    vec2 ipos = floor(uv);
    vec2 fpos = fract(uv);

    float a = hash12(ipos);
    float b = hash12(ipos + vec2(1, 0));
    float c = hash12(ipos + vec2(0, 1));
    float d = hash12(ipos + vec2(1, 1));

    vec2 t = smoothstep(0.0, 1.0, fpos);

    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

// returns 3D value noise (in .x)  and its derivatives (in .yz)
vec3 noised( vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );

    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);

    vec2 ga = hash( i + vec2(0) );
    vec2 gb = hash( i + vec2(1.0,0.0) );
    vec2 gc = hash( i + vec2(0.0,1.0) );
    vec2 gd = hash( i + vec2(1.0,1.0) );

    float va = dot( ga, f - vec2(0.0,0.0) );
    float vb = dot( gb, f - vec2(1.0,0.0) );
    float vc = dot( gc, f - vec2(0.0,1.0) );
    float vd = dot( gd, f - vec2(1.0,1.0) );

    return vec3( va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd),   // value
                 ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +  // derivatives
                 du * (u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va));
}

//vec3 getNormal(vec2 p) {
    //float d = length(p);
    //vec3 eps = vec3(d*.01);
    //return vec3(noise(p + eps));

    //float d = getDist(p);
    //vec2 e = vec2(length(p) * .001, 0);
    //vec3 n = d - vec3(getDist(p-e.xyy),
                      //getDist(p-e.yxy),
                      //getDist(p-e.yyx));
    //return normalize(n);
//}

void main(void)
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy;   // normalized pixel coordinates (from 0 to 1)
    uv -= 0.5;                                  // centers uv
    float s = scale(-1., 1., 1., 20., sin(iTime));
    uv *= s;

    vec3 height;
    vec3 grad;

    height = vec3(noise(uv+vec2(.5*s,0)));
    grad = vec3(noised(uv).yz, 0);

    gl_FragColor = vec4( (uv.x>0.)?grad:height, 1.0);
}
