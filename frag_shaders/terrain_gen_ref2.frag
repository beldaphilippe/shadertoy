#version 330 core

uniform vec2 iResolution;
uniform float iTime; // in seconds
uniform vec2 iMouse;


vec3 CameraRay(vec2 uv)
{
 	return vec3(uv.x, uv.y, 1.2);
}

float min3(vec3 v)
{
    return min(v.x, min(v.y, v.z));
}

float min4(vec4 v)
{
    return min(min(v.x, v.y), min(v.z, v.w));
}

float max3(vec3 v)
{
    return max(v.x, max(v.y, v.z));
}

float max4(vec4 v)
{
    return max(max(v.x, v.y), max(v.z, v.w));
}

#define C01 0
#define C11 1
#define C10 2
#define C00 3

float EvalHeightmap(ivec2 co)
{
    return 4.*max3(texture(iChannel1, vec2(co)/64.0f).rgb);
    //return fract(sin(dot(vec2(co)*500.0f, vec2(12.9898, 78.233))) * 43758.5453);
}

float Displacement(ivec2 coord)
{
    //return 1.0f;
    return texture(iChannel2, vec2(coord)/128.0f+vec2(iTime, iTime)*0.01).r*0.5+0.5;
}

vec4 SampleHeightMap(ivec2 coord)
{

    float h00 = EvalHeightmap(coord+ivec2(0,0))*Displacement(coord+ivec2(0,0));
    float h01 = EvalHeightmap(coord+ivec2(0,1))*Displacement(coord+ivec2(0,1));
    float h10 = EvalHeightmap(coord+ivec2(1,0))*Displacement(coord+ivec2(1,0));
    float h11 = EvalHeightmap(coord+ivec2(1,1))*Displacement(coord+ivec2(1,1));

    return vec4(h01, h11, h10, h00);

}

bool IntersectTriangle(
    vec3 v1, vec3 v2, vec3 v3,
    vec3 rayOrigin, vec3 rayDirection, float tmin, float tmax,
    out float hitT)
{
    hitT = 0.0;

    vec3 e1 = v2 - v1;
    vec3 e2 = v3 - v1;

    vec3 s1 = cross(rayDirection, e2);
    float determinant = dot(s1, e1);
    float invd = 1.0/(determinant);

    vec3 d = rayOrigin - v1;
    float u = dot(d, s1) * invd;

    bool ok = true;
    if (determinant == 0.0f)
        return false;

    float thickness = 0.02;
    if (u < thickness || u > 1.f-thickness)
        ok = false;

    vec3 s2 = cross(d, e1);
    float v = dot(rayDirection, s2) * invd;

    if ((v < thickness) || (u + v > 1.f-thickness))
        ok = false;

    float t = dot(e2, s2) * invd;
    //if (t < tmin || t > tmax)
    //    ok = false;

    hitT = t;

    return ok;
}

float IntersectMapTriangle(float C, float A, float B, vec3 rayOrigin, vec3 rayDirection, float X, float Z)
{
    return (-rayOrigin.y + A*(rayOrigin.x-X) + B*(rayOrigin.z-Z) + C) / (rayDirection.y -A*rayDirection.x - B*rayDirection.z);
}

bool TraceRay(vec3 rayOrigin, vec3 rayDirection, out ivec2 hitTexel, out int hitTriangle, out float tHit)
{
   if (rayDirection.x == 0.0)
       rayDirection.x = 1.e-37;

   if (rayDirection.z == 0.0)
       rayDirection.z = 1.e-37;


    float terrainBoundsHeight = 10.0;

    float tStart = (terrainBoundsHeight - rayOrigin.y) /rayDirection.y;
    if (rayDirection.y >0.0)
        	return false;

     vec2 res = vec2(tStart, 40.0);
     if (res.x > res.y)
        return false;

    ivec3 step = ivec3(sign(rayDirection));
    vec3 pStart = rayOrigin + res.x*rayDirection;
    ivec3 startTexel = ivec3(pStart);

    int X = startTexel.x;
    int Z = startTexel.z;

    // ray marching values
    // used same variable names as in "A Fast Voxel Traversal Algorithm for Ray Tracing" paper
    float tDeltaX = 1.0 / abs(rayDirection.x);
    float tMaxX = (float(startTexel.x) + (step.x > 0 ? 1.0f : 0.0f) - rayOrigin.x) / rayDirection.x;

    float tDeltaZ = 1.0 / abs(rayDirection.z);
    float tMaxZ = (float(startTexel.z) + (step.z > 0 ? 1.0f : 0.0f) - rayOrigin.z) / rayDirection.z;

    bool hit = false;
    float tTexelEntry = res.x;
    float tBBoxExit = res.y;

    // Find out if we start above or below the the heightmap
    /*vec4 texelHeights = terrainBoundsHeight*SampleHeightMap( ivec2(X,Z));
    vec2 uv = pStart.xz - vec2(X,Z);
    float hMapAtEntry;
    if (uv.x > uv.y)
    {
        hMapAtEntry = texelHeights[C00] + uv.x * (texelHeights[C10] - texelHeights[C00]) + uv.y * (texelHeights[C11] - texelHeights[C10]);
    }
    else
    {
        hMapAtEntry = texelHeights[C00] + uv.x * (texelHeights[C11] - texelHeights[C01]) + uv.y * (texelHeights[C01] - texelHeights[C00]);
    }
    float hitSign = pStart.y - hMapAtEntry > 0.0f ? -1.0f : 1.0f;*/
    float hitSign = -1.0f;

    int i = 0;
    while (tTexelEntry < tBBoxExit && i < 128)
    {
        float tTexelExit = (tMaxX < tMaxZ) ? tMaxX : tMaxZ;
        float hRayAtExitEdge = rayOrigin.y + tTexelExit*rayDirection.y;
        float hRayAtEnterEdge = rayOrigin.y + tTexelEntry*rayDirection.y;

        vec4 texelHeights = terrainBoundsHeight*SampleHeightMap( ivec2(X,Z));

        // ray to texel bbox intersection test for early out
        if (sign(min(hRayAtExitEdge, hRayAtEnterEdge) - max4(texelHeights)) == hitSign )
            //|| sign(max(hRayAtExitEdge, hRayAtEnterEdge) - min4(texelHeights)) == hitSign)
        {
            float t1 = IntersectMapTriangle(texelHeights[C00], texelHeights[C10] - texelHeights[C00], texelHeights[C11] - texelHeights[C10],
                rayOrigin, rayDirection, float(X), float(Z));
            vec2 p1 = rayOrigin.xz - vec2(X,Z) + t1*rayDirection.xz;
            if (clamp(p1, vec2(0.0), vec2(1.0)) == p1 && p1.x >= p1.y && t1 >= tTexelEntry)
            {
                hitTriangle = 0;
                tHit =  t1;
                hit = true;
            }

            float t2 = IntersectMapTriangle(texelHeights[C00], texelHeights[C11] - texelHeights[C01], texelHeights[C01] - texelHeights[C00],
                rayOrigin, rayDirection, float(X), float(Z));
            vec2 p2 = rayOrigin.xz - vec2(X,Z) + t2*rayDirection.xz;
            if (clamp(p2, vec2(0.0), vec2(1.0)) == p2  && p2.x <= p2.y && t2 >= tTexelEntry && (!hit || t2 < t1))
            {
                hitTriangle = 1;
                tHit = t2;
                hit = true;
            }

            if (hit)
                break;
        }

        // Determine coordinates of next texel to visit
        tTexelEntry = tTexelExit;
        if (tMaxX < tMaxZ)
        {
            tMaxX = tMaxX + tDeltaX;
            X = X + step.x;

        }
        else
        {
            tMaxZ = tMaxZ + tDeltaZ;
            Z = Z + step.z;
        }
        i++;
    }

    hitTexel = ivec2(X,Z);

    return hit;
}

mat3 RotateZ(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}

mat3 RotateX(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

void main(void)
{
    vec3 cameraPos = vec3(2.0,10.0, iTime);

	//Creating ray
    vec3 rayOrigin = cameraPos;
    vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    vec3 rayDirection = normalize(RotateX(-0.6) * CameraRay(uv));
    vec4 col = vec4(0.0);

    ivec2 hitTexel;
    int hitTriangle;

    vec4 sky = vec4(0.0, 0.588, 0.588, 1.0);
    sky += texture(iChannel2, rayDirection.xy+vec2(0.0, -iTime*0.01))*0.06;
    sky = mix(sky, vec4(1.0), clamp(uv.y, 0.5, 1.0));

    float traceHitDistance;
    if (TraceRay(rayOrigin, rayDirection, hitTexel, hitTriangle, traceHitDistance))
    {
        vec4 texelHeights = 10.0*SampleHeightMap(hitTexel);

        vec3 v1 = vec3(hitTexel.x, texelHeights.w, hitTexel.y);
        vec3 v2 = vec3(hitTexel.x+1, texelHeights.y, hitTexel.y+1);
        vec3 v3 = hitTriangle == 0 ? vec3(hitTexel.x+1, texelHeights.z, hitTexel.y) : vec3(hitTexel.x, texelHeights.x, hitTexel.y+1);
        vec3 normal = hitTriangle == 0 ? normalize(cross(v2-v1, v3-v1)) : -normalize(cross(v2-v1, v3-v1));

        vec3 lightDir = normalize(vec3(0.2,0.2,0.000));
        float lambert = clamp(dot(normal, lightDir), 0.0, 1.0);

        float hitT;
        bool valid = IntersectTriangle(v1, v2, v3, rayOrigin, rayDirection, 0.0f, 10000.0f, hitT);

        float v = SampleHeightMap(hitTexel).x*lambert;
        col = vec4(v,v,v, 1.0)+0.4;

        vec3 R = reflect( lightDir, normal );
        col += pow( clamp( dot( R, rayDirection ), 0.0, 1.0), 10.0 )*0.4;

        col *= vec4(204.0/255.0, 0.0, 102.0/255.0, 1.0);
        if (!valid)
            col = vec4(0.45, 0.0, 0.0, 1.0);


        col = mix(col, sky, traceHitDistance/40.0);
    }
    else
    {
        col = sky;
    }



    gl_FragColor = col;
}
