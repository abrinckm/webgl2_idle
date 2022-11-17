#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

const float M_PI = 3.141592653589793;
const float GAMMA = 2.2;
const vec3 INV_GAMMA = vec3(1.0/GAMMA);

float clampedDot(vec3 x, vec3 y)
{
    return clamp(dot(x, y), 0.0, 1.0);
}

const int Directional = 0;
const int Point = 1;
const int Spot = 2;

struct Light {
    int type;
    vec3 color;
    vec3 direction;
    vec3 position;
    float linear;
    float quadratic;
};

in vec2 texCoord;
in vec3 fragPos;
#ifdef HAS_BASE_COLOR
in vec4 baseColor;
#endif
in vec3 lightPos;
in mat3 TBN;

uniform vec3 uSpecularFactor;
uniform float uGlossinessFactor;
uniform vec4 uDiffuseFactor;
uniform vec3 uEmissiveFactor;
uniform float uOcclusionStrength;
uniform float uNormalScale;
uniform vec3 uViewPos;
#ifdef LIGHTS
    const int numLights = LIGHTS;
#else
    const int numLights = 1;
#endif
uniform Light uLights[numLights];

uniform sampler2D uDiffuseMap;
uniform sampler2D uNormalMap;
uniform sampler2D uSpecularGlossinessMap;
uniform sampler2D uEmissiveMap;
uniform sampler2D uOcclusionMap;
uniform samplerCube skybox;

out vec4 fragColor;


vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float DistributionGGX(float NdotH, float roughness)
{
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH2 = NdotH*NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = M_PI * denom * denom;
	
    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}

float GeometrySmith(float NdotV, float NdotL, float roughness)
{
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}

// linear to sRGB approximation
// see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
vec3 linearTosRGB(vec3 color)
{
    return pow(color, vec3(INV_GAMMA));
}

// ACES filmic tone map approximation
// see https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl
vec3 RRTAndODTFit(vec3 color)
{
    vec3 a = color * (color + 0.0245786) - 0.000090537;
    vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
    return a / b;
}

// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
const mat3 ACESInputMat = mat3
(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
);


// ODT_SAT => XYZ => D60_2_D65 => sRGB
const mat3 ACESOutputMat = mat3
(
    1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
);

// tone mapping 
vec3 toneMapACES_Hill(vec3 color)
{
    color = ACESInputMat * color;

    // Apply RRT and ODT
    color = RRTAndODTFit(color);

    color = ACESOutputMat * color;

    // Clamp to [0, 1]
    color = clamp(color, 0.0, 1.0);

    return color;
}

// ACES tone map (faster approximation)
// see: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 toneMapACES_Narkowicz(vec3 color)
{
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0);
}

vec3 tonemap(vec3 color)
{
    // Narkowicz
    // return toneMapACES_Narkowicz(color);
    // return linearTosRGB(color);


    // Hill +Exposure
    color /= 0.6;
    color = toneMapACES_Hill(color);
    return linearTosRGB(color);

    // Basic
    // color /= (color + vec3(1.0));
    // return pow(color, INV_GAMMA);
}


void main() {
    vec4 baseDiffuse = uDiffuseFactor;
#ifdef HAS_BASE_COLOR
    baseDiffuse *= baseColor;
#endif
#ifdef HAS_DIFFUSE_MAP
     baseDiffuse *= texture(uDiffuseMap, texCoord);
#endif

    vec3 f0 = uSpecularFactor;
    vec3 f90 = vec3(1.0);
    float perceptualRoughness = uGlossinessFactor;
    float specularWeight = 1.0;

#ifdef HAS_SPECULAR_GLOSSINESS_MAP
    vec4 specColor = texture(uSpecularGlossinessMap, texCoord);
    perceptualRoughness *= specColor.a;
    f0 *= specColor.rgb;
#endif

    perceptualRoughness = clamp(1.0 - perceptualRoughness, 0.0, 1.0);
    float alphaRoughness = perceptualRoughness * perceptualRoughness;
    float reflectance = max(max(f0.r, f0.g), f0.b);
    vec3 c_diff = baseDiffuse.rgb * (1.0 - reflectance);

    vec3 n;
#ifdef HAS_NORMAL_MAP
    n = texture(uNormalMap, texCoord).rgb;
    n *= vec3(uNormalScale, uNormalScale, 1.0);
    n = n * 2.0 - 1.0;
    n = normalize(TBN * n);
#else
    n = normalize(TBN[2]);
#endif
    n *= (2.0 * float(gl_FrontFacing) - 1.0); // NOTE(Adam): Flip backfacing normals?

    vec3 Lo = vec3(0.0);
    float ao = 0.0;

    vec3 v = uViewPos - fragPos;
    float NdotV = clampedDot(n, v);
    float TdotV = clampedDot(TBN[0], v);
    float BdotV = clampedDot(TBN[1], v);

    for (int i = 0; i < numLights; i++) {
        Light light = uLights[i];
        vec3 lightColor = light.color;
        vec3 l;
        if (light.type == Directional) {
            l = normalize(-light.direction);
        }
        else if (light.type == Point) {
            l = light.position - fragPos;
            float dist = length(l);
            l = normalize(l);
            float attenuation = 1.0 / (1.0 + (light.linear * dist) + (light.quadratic * (dist * dist)));
            lightColor *= attenuation;
        }
        vec3 h = normalize(l + v);
        float NdotL = clampedDot(n, l);
        float NdotH = clampedDot(n, h);
        float LdotH = clampedDot(l, h);
        float VdotH = clampedDot(v, h);

        if (NdotL > 0.0 || NdotV > 0.0)
        {
            vec3 F = fresnelSchlick(VdotH, f0);
            float NDF = DistributionGGX(NdotH, alphaRoughness);
            float G = GeometrySmith(NdotV, NdotL, alphaRoughness);
            vec3 numerator = NDF * G * F;
            float denominator = 4.0 * NdotV * NdotL + 0.0001;
            vec3 f_specular = numerator / denominator;
            vec3 f_diffuse = (vec3(1.0) - F) * c_diff;
            Lo += (f_diffuse / M_PI + f_specular) * lightColor * NdotL;
        }
    }

    vec3 f_emissive = uEmissiveFactor;
#ifdef HAS_EMISSIVE_MAP
    f_emissive *= texture(uEmissiveMap, texCoord).rgb;
#endif

#ifdef HAS_OCCLUSION_MAP
    ao = texture(uOcclusionMap, texCoord).r;
    Lo = mix(Lo, Lo * ao, uOcclusionStrength);
#endif

    vec3 color = f_emissive + Lo;

    fragColor = vec4(tonemap(color.rgb), baseDiffuse.a);
}