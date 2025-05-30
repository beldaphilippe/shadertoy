#version 330 core

uniform vec2 iResolution;       // image resolution
uniform float iTime;            // global clock (s)
uniform vec2 iMouse;            // mouse position (px)

// UTILS ===

#define PI              3.14159265358979323846
#define PHI             1.61803398874989484820459
#define rot(a)          mat2(cos(a), -sin(a), sin(a), cos(a))
#define rotpi2          mat2(0, -1, 1, 0)

// Noises

float N21_1(vec2 p) {
   return fract(sin(p.x*24. + p.y*605.)*4879.);
}

float N21_2(vec2 p) {
   vec3 p3  = fract(vec3(p.xyx) * .1031);
   p3 += dot(p3, p3.yzx + 33.33);
   return fract((p3.x + p3.y) * p3.z);
}

float N21_3(vec2 uv) {
   return fract(sin(dot(uv, vec2(73211.171, 841.13))) * 32131.18128);
}

float N21_4(vec2 uv) {
   vec2 ipos = floor(uv);
   vec2 fpos = fract(uv);

   float a = N21_2(ipos);
   float b = N21_2(ipos + vec2(1, 0));
   float c = N21_2(ipos + vec2(0, 1));
   float d = N21_2(ipos + vec2(1, 1));

   vec2 t = smoothstep(0.0, 1.0, fpos);

   return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

float gold_noise(in vec2 xy, in float seed) {
   xy += 13.;
   return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

vec2 N22(vec2 uv) {
   return vec2(N21_3(uv), N21_3(uv+.3));
}

float voronoi(vec2 uv) {
   float resolution = 4.;
   float dmin = 2.*resolution*resolution;                // distance to closest voronoi cell
   vec2 ruv = mod(uv, resolution); // relative uv in the cell
   vec2 id;
   vec2 rvoi;
   vec2 d;
   for (int i=-1; i<2; i++)
      for (int j=-1; j<2; j++) {
         id = (uv - ruv) / resolution;   // id of cell
         id += vec2(i, j);
         rvoi = ( vec2(i,j) + vec2(gold_noise(id, 33.), gold_noise(id + resolution*.3, 33.)) ) * resolution; // relative pos of voroi point
         d = ruv - rvoi;
         dmin = min(dmin, dot(d,d));
      }
   return sqrt(dmin) / resolution;
}

vec2 voronoi_flat(vec2 uv) {
   // return the color of voronoi cell and the distance to the center
   float resolution = 1.;
   float dmin = 2.*resolution*resolution;                // distance to closest voronoi cell
   vec2 ruv = mod(uv, resolution); // relative uv in the cell
   vec2 id, rvoi, d, idmin;
   float dsq;
   for (int i=-1; i<2; i++)
      for (int j=-1; j<2; j++) {
         id = (uv - ruv) / resolution;   // id of cell
         id += vec2(i, j);
         rvoi = ( vec2(i,j) + vec2(gold_noise(id, 33.), gold_noise(id + resolution*.3, 33.)) ) * resolution; // relative pos of voroi point
         d = ruv - rvoi;
         dsq = dot(d,d);
         if (dmin > dsq) {
            idmin = id;
            dmin = dsq;
         }
      }
   return vec2(N21_3(idmin), sqrt(dmin) / resolution);
}

vec4 voronoi_dev(vec2 uv) {
   // https://www.shadertoy.com/view/ldl3W8
   vec2 ip = floor(uv); // integer part
   vec2 fp = fract(uv); // fractional part

   //----------------------------------
   // first pass: regular voronoi
   //----------------------------------
   vec2 mg, mr;

   float md = 8.0; // min dist
   for( int j=-1; j<=1; j++ )
      for( int i=-1; i<=1; i++ )
         {
            vec2 g = vec2(float(i),float(j));   // relative grid cell considered
            vec2 o = N22( ip + g );           // offset to center of voronoi cell
            vec2 r = g + o - fp;                // vector from uv to voronoi center considered
            float d = dot(r,r);
            if( d<md )
               {
                  md = d;
                  mr = r;
                  mg = g;
               }
         }
   //----------------------------------
   // second pass: distance to borders
   //----------------------------------
   md = 8.0;
   for( int j=-2; j<=2; j++ )
      for( int i=-2; i<=2; i++ )
         {
            vec2 g = mg + vec2(float(i),float(j));
            vec2 o = N22( ip + g );
            vec2 r = g + o - fp;

            if( dot(mr-r,mr-r)>0.00001 )
               md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
         }

   return vec4(md, N21_3(ip+mg), mr);
}


// Spatial transformation operators

// Translate the objects in [0,1]³ of vector <d>.
vec3 transOP(vec3 p, vec3 d) {
   return p -d;
}

// Replicate the objects in [0,c.x] x [0,c.y] x [0,c.z] periodically through space.
// If a <c> coordinate is null, then the replication is not done along corresponding axis.
vec3 repOP(vec3 p, vec3 c) {
   p.x = (c.x > 0) ? mod(p.x, c.x) - c.x*.5 : p.x;
   p.y = (c.y > 0) ? mod(p.y, c.y) - c.y*.5 : p.y;
   p.z = (c.z > 0) ? mod(p.z, c.z) - c.z*.5 : p.z;
   return p;
}

// Twists the objects in [0, 1]³ around the vertical axis going through <c>.
vec3 twistOP(vec3 p, vec3 c) {
   float nt = .2;  // number of turns
   float oh = 4.;  // object height
   p.xz = (p.xz-c.xz)*rot(nt*2*PI/oh * p.y) + c.xz;
   return p;
}

// Rotates the objects in [0,1]³ around the vertical axis going through <c> over time.
vec3 rotTOP(vec3 p, vec3 c) {
   p.xz = (p.xz-c.xz)*rot(.7*iTime) + c.xz;
   return p;
}

// PARAMETERS ===

#define MAX_STEPS       100     // maximum number of steps for ray marching
#define R_FACTOR        .4      // ray marching factor, very important to avoid artifacts (can be changed a bit)
#define DIST_CONTACT    .01     // distance of contact for ray marching
#define FAR             50.     // maximum render distance

#define ALT_MAX         1.      // maximum altitude, to shape terrain
// #define CAST_SHADOWS          // enables cast shadows
#define HARMONICS       2.      // number of harmonics of the Brownian noise used for terrain
#define BIOME_SIZE      9.      // factor for the size of different biomes (voronoi cells)
float BIOME_DENSITY[2] = float[] (.6, .8); // the probability interval of apparition of each biome (in [0, 1])

// CODE ===

vec3 randCol(vec2 id) {
   float seed = 33.;
   return vec3(gold_noise(id, seed+0.1),  // r
               gold_noise(id, seed+0.2),  // g
               gold_noise(id, seed+0.3)); // b
}

// Distance to mountains in <xz>.
// Moutains are drawn with a Fractional Brownian Motion with <harmonics> harmonics.
float sdMountains(vec3 p, int harmonics) {
   float dist = p.y;             // distance of <p> to mountains
   float amp = ALT_MAX;         // initial amplitude of fBM
   float freq = 1.;             // initial frequence of fBM
   for (int i=0; i<harmonics; i++) {
      if (dist > amp * 20) break; // if subsequent harmonics do not bring significanly more precision, break
      dist -= amp * N21_4(p.xz * freq);
      p.xz = p.xz * rot(0.3);   // rotation to avoid domain alignment
      freq *= 2.;               // harmonics
      amp *= .3;                // amplitude variation
   }
   return dist;
}

// Sdf of a sphere of radius <radius>.
float sdSphere(vec3 p, float radius) {
   vec3 center = vec3(0.);
   p.y = .5*p.y;
   return length(p) - radius;
}

// Sdf of the universe.
// Return the distance to the closest object as well as its id.
// <harmonics> is used to generate the Fractional Brownian Motion.
vec2 getDist(vec3 p, int harmonics)
{
   vec2 s = voronoi_dev(p.xz/BIOME_SIZE).yx; // id and distance to the borders of the biome
   float dm = sdMountains(p, harmonics);     // distance to mountains
   float dw = p.y - 0.;         // distance to water, at altitude 0
   // Mountains
   if (s.x < BIOME_DENSITY[0]) {
      return vec2(min(dw, (dw - dm)*smoothstep(0.3, 0., s.y) + dm), 0); // for transition with other biomes
      // return dm;
      // return p.y - ((dm-dw)*smoothstep( .1*BIOME_SIZE, 0., s.y) + dw);
      //return p.y - max(dw, dm*(1.-3.*s.y*s.y/BIOME_SIZE));
      //return p.y - ((dm-dw)*smoothstep(BIOME_SIZE/12., BIOME_SIZE/10., s.y)+dw);
      //return p.y - (dm-dw)*(1.-3.*s.y*s.y/BIOME_SIZE)-dw;
      //return p.y - max((dm-dw)*smoothstep( .4*BIOME_SIZE, 0., s.y) + dw, dw);
      //return p.y - max(mix(mm, ww, s.y*2.), ww);
      
   }
   // Forest
   else if (s.x < BIOME_DENSITY[1]) {
      float period = 0.2;           // inverse density of trees
      vec2 id = floor(p.xz/period); // id of tree
      vec3 dl = vec3(0); // we move randomly each spatial copy of the tree to avoid regularity
      dl.xz = .1 * (N22(id) - 0.5);
      dm = p.y - 0.7 * (p.y - dm); // gentle hills for forests
      dm = min(dw, ((dw - dm)*smoothstep(0.2, 0., s.y) + dm)); // for transition to other biomes
      if (voronoi_dev(p.xz/BIOME_SIZE + dl.xz).x < 0.1) { // to ensure a tree do not cross biome border
         return vec2(dm, 0);
      }
      float dt = sdSphere(repOP(transOP(p, vec3(0, p.y - dm, 0) + dl), vec3(period, 0, period)), .05); // distance to the tree of this id
      if (dt > dm) {
         return vec2(dm, 0);
      } else {
         return vec2(dt, 1);
      }
   }
   // Water
   else {
      return vec2(dw, 0);
   }
}

// Return the normal vector on point <p> of the universe.
vec3 getNormal(vec3 p, int ha) {
   float d = getDist(p, ha).x;
   vec2 e = vec2(.01, 0);
   vec3 n = d - vec3(getDist(p-e.xyy, ha).x,
                     getDist(p-e.yxy, ha).x,
                     getDist(p-e.yyx, ha).x);
   return normalize(n);
}

// Execute the ray marching algorithm and return the distance to the universe from <ro> along the ray <rd> and the id of hit object.
vec2 rayMarching(vec3 ro, vec3 rd) {
   float dO = 0.;               // dist of item hit
   int ha;                      // number of harmonics in fBM noise
   int obj_id;                  // id of hit object
   for (int i=0; i<MAX_STEPS; i++) {
      vec3 p = ro + rd*dO;
      ha = int(max((1.-HARMONICS)/FAR * length(ro - p) + HARMONICS, 1.)); // harmonics
      vec2 res = getDist(p, ha);
      float dS = res.x;
      obj_id = int(res.y);
      dO += dS*R_FACTOR;
      if (dS<DIST_CONTACT || dO>FAR) break;
   }
   return vec2(dO, obj_id);
}

float getLight2(vec3 p, int ha) {
   vec3 lo = vec3(0, 3, 0); // light origin
   //lo.xz += 2.*vec2(cos(iTime), sin(iTime));

   vec3 n = getNormal(p, ha); // surface normal at point p
   vec3 l = normalize(lo-p); // light vector

   float diff = clamp(dot(n, l), 0., 1.); // dot product can be negative
   //float diff = smoothstep(0., 1., .5*dot(n, l) + .5); // dot product can be negative
   float d = rayMarching(p + n*DIST_CONTACT*2., l).x;
   if (d < length(lo-p)) diff = .1;                    // cast shadow

   //if (length(lo - p) < 1.) return 1.;

   return diff;
}

float castShadows(vec3 p, vec3 ro, vec3 n, vec3 ld) {
   vec3 rob = p+2.*DIST_CONTACT*n;
   vec3 rd = ld;
   float dO = 0.;      // dist of item hit
   int ha;             // number of fbm harmonics
   for (int i=0; i<MAX_STEPS; i++) {
      vec3 pb = rob + rd*dO;
      int ha = int(max((1.-HARMONICS)/FAR * length(ro - pb) + HARMONICS, 1.)); // harmonics
      float dS = getDist(pb, ha).x;
      dO += dS*R_FACTOR;
      if (dS<DIST_CONTACT || dO>FAR) break;
   }
   if (dO < FAR) return .1;
   return 1.;
}

float getLight(vec3 p, vec3 ro, vec3 n, vec3 ld) {
   // TODO : implement specular lighting
   //int ha = int(max((1.-HARMONICS)/FAR * length(ro - p) + HARMONICS, 1.)); // harmonics
   //vec3 n = getNormal(p, ha);               // surface normal at point p

   float diffuse = dot(n, ld); // diffuse component
   diffuse = mix(clamp(diffuse, 0., 1.), .5*diffuse+.5, .2); //+ 4.*smoothstep(.98, 1., diffuse); // diffuse and phong reflection
   float ambiant = .1;
   return max(.75*diffuse, ambiant);
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

vec3 waterMovement(vec2 uv) {
   // source: https://www.shadertoy.com/view/MdlXz8
#define TAU 6.28318530718
#define MAX_ITER 4
   float time = iTime * .5+23.0;
   // uv should be the 0-1 uv of texture...
   vec2 p = mod(uv*TAU, TAU)-250.0;
   vec2 i = vec2(p);
   float c = 1.0;
   float inten = .005;

   for (int n = 0; n < MAX_ITER; n++)
      {
         float t = time * (1.0 - (3.5 / float(n+1)));
         i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
         c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
      }
   c /= float(MAX_ITER);
   c = 1.17-pow(c, 1.4);
   vec3 colour = vec3(pow(abs(c), 8.0));
   return clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);
}

vec3 mountain_biome(vec3 p, vec3 n, int obj_id) {
   // Color definitions
   vec3 pcolor;
   vec3 earth = vec3(183, 135, 75)/100.;
   vec3 grass = vec3(0, 1, 0);
   vec3 snow = vec3(2);
   vec3 water = vec3(14, 135, 204)/100.;
   //vec3 water = waterMovement(p.xz);
   // Object choice
   switch (obj_id) {
   case 0:                      // ground
      pcolor = earth;                                                                                                     // earth
      pcolor = mix(pcolor, grass, smoothstep(0., 1.6, abs(dot(n, vec3(0,1,0))) ) * smoothstep(ALT_MAX, ALT_MAX*.8, p.y)); // grass
      pcolor = mix(pcolor, snow, smoothstep(0., 1., abs(dot(n, vec3(0,1,0))) ) * smoothstep(ALT_MAX, ALT_MAX*1.2, p.y)); // swnow
      //if (p.y < ALT_MAX*.51) { // mountain lakes
      //pcolor = mix(pcolor, water, smoothstep(.9, 1., abs(dot(n, vec3(0, 1, 0)))));
      //pcolor = water;
      //pcolor = 2. * waterMovement(p.xz);
      //}
      return pcolor;
   default:                     // default
      return vec3(1);
   }
}

vec3 forest_biome(vec3 p, vec3 n, int obj_id) {
   // Color definitions
   vec3 pcolor;
   vec3 earth = vec3(183, 135, 75)/100.;
   vec3 grass = vec3(0,1,0);
   vec3 leaf = vec3(26, 36, 33)/100.;
   vec3 snow = vec3(2);
   switch (obj_id) {
   case 0:                      // ground
      pcolor = earth;
      pcolor = mix(pcolor, grass, smoothstep(0., 1.6, abs(dot(n, vec3(0,1,0))) ) * smoothstep(ALT_MAX, ALT_MAX*.8, p.y)); // grass
      pcolor = mix(pcolor, snow, smoothstep(0., 1., abs(dot(n, vec3(0,1,0))) ) * smoothstep(ALT_MAX, ALT_MAX*1.2, p.y));  // swnow
      return pcolor;
   case 1:                      // trees
      return leaf;
   default:                     // default texture
      return vec3(1);
   }
}

vec3 marshes_biome(vec3 p, vec3 n, int obj_id) {
   switch (obj_id) {
   case 0:                      // water
      return vec3(14, 135, 204)/100.;
      // return waterMovement(p.xz);
   default:
      return vec3(1);
   }
}

vec3 biomes(vec3 p, vec3 n, int obj_id) {
   float s = voronoi_dev(p.xz/BIOME_SIZE).y; // shade of voronoi cell
   if (s<BIOME_DENSITY[0])
      return mountain_biome(p, n, obj_id);
   else if (s<BIOME_DENSITY[1]) {
      return forest_biome(p, n, obj_id);
   } else
      return marshes_biome(p, n, obj_id);
}

vec3 render(vec3 ro, vec3 rd) {

   vec2 rm = rayMarching(ro, rd); // dist to a surface, id of item hit
   float dS = rm.x;
   int obj_id = int(rm.y);
   vec3 p = ro + rd*dS;         // hit point
   int ha = int(max((1.-HARMONICS)/FAR * dS + HARMONICS, 1.)); // number of fbm harmonics
   vec3 n = getNormal(p, ha);

   // LIGHTS

   vec3 ld = normalize(vec3(1));           // light direction
   // float diff = getLight(p, ro, n, ld);
   float diff = .5;
   float cshadows = 1.;
#ifdef CAST_SHADOWS
   cshadows = castShadows(p, ro, n, ld);
#endif
   diff = min(diff , cshadows);

   // COLORS

   vec3 pcolor = biomes(p, n, obj_id);
   vec3 sky = vec3(53, 81, 92)/100. - normalize(rd).y/4.;

   //return mix(getNormal(p, ha)*.5+.5, sky, smoothstep(FAR*.5, FAR, dS));
   //return mix(pcolor, sky, smoothstep(FAR*.5, FAR, dS));
   return mix(pcolor * diff, sky, smoothstep(FAR*.4, FAR, dS)); // sky
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
