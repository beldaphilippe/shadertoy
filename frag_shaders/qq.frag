#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;

//https://www.shadertoy.com/view/ldKyWc

//change the below define if you don't want to see cool glitch
#define SHOW_GLITCH 0

float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash(vec2 uv)
{
    return fract(sin(dot(uv, vec2(73211.171, 841.13))) * 32131.18128);
}

float noise(vec2 uv)
{
    vec2 ipos = floor(uv);
    vec2 fpos = fract(uv);
    
    float a = hash12(ipos);
    float b = hash12(ipos + vec2(1, 0));
    float c = hash12(ipos + vec2(0, 1));
    float d = hash12(ipos + vec2(1, 1));
    
    vec2 t = smoothstep(0.0, 1.0, fpos);
    
    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

mat2 rot2(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return mat2(
        c, -s,
        s, c
    );
}

float fbm(vec2 uv)
{
    float acc = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 9; ++i)
    {
        acc += amp * noise(freq * uv);
        uv = uv * rot2(0.3);
        freq *= 2.0;
        amp *= 0.5;
    }
    return acc;
}

float intersect(in vec3 ro, in vec3 rd, in float t_max, out bool hit)
{
    hit = false;
    float t = 0.1;
    
    for (int i = 0; i < 256; ++i)
    {
        vec3 p = ro + t*rd;
        float h = p.y - fbm(p.xz);
        if (h < 0.004*t || t > t_max)
        {
#if !SHOW_GLITCH
            if (t <= t_max)
            {
#endif
            	hit = true;
#if !SHOW_GLITCH  
            }
#endif
            break;
        }

        
        t += 0.25 * h;
    }
    return t;
}

void main(void)
{
    vec2 uv = (2. * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    
    float offset = -1.0;
    vec3 ro = vec3(offset, 0.0, 0.0);
    vec3 at = vec3(offset, -0.5, 4.0);
    vec3 cam_z = normalize(at - ro);
    vec3 cam_x = normalize(cross(vec3(0, 1, 0), cam_z));
    vec3 cam_y = normalize(cross(cam_z, cam_x));
    vec3 rd = cam_x * uv.x + cam_y * uv.y + 2.0 * cam_z;
    
    ro += vec3(0.0, 0.8, mod(1.0*iTime, 1000.0));
    vec3 l = normalize(vec3(0.5, -0.5, 0.5));
    
    bool hit;
    float t_max = 27.5;
    float t = intersect(ro, rd, t_max, hit);
    
    vec3 p = ro + t*rd;
    
    //NOTE(chen): a hack, note dpdx and dpdz are not actual partial derivatives, just some offseted vector
    vec3 px = vec3(p.x + 0.0001, 0.0, p.z);
    vec3 pz = vec3(p.x, 0.0, p.z + 0.0001);
    vec3 dpdx = vec3(px.x, fbm(px.xz), px.z);
    vec3 dpdz = vec3(pz.x, fbm(pz.xz), pz.z);
    
    vec3 normal = normalize(cross(dpdz, dpdx));
    
    vec3 background = vec3(0.8, 0.8, 0.5);
    vec3 col = background;
    if (hit)
    {
        float occ = max(0., 2.0*p.y);
        float dl = 0.25 * pow(dot(normal, -l) + 1.0, 2.0);
        float lighting = 0.9 * dl + 0.3;
        vec3 mat = vec3(0.8, 0.3, 0.0);
        
        col = mix(occ * lighting * mat, background, pow(t / t_max, 1.5));
    }
    
    gl_FragColor = vec4(col, 1.0);
}
