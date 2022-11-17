#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

const float M_PI = 3.141592653589793;

float clampedDot(vec3 x, vec3 y)
{
    return clamp(dot(x, y), 0.0, 1.0);
}

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH)
{
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
// see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3
// see Real-Time Rendering. Page 331 to 336.
// see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)
float V_GGX(float NdotL, float NdotV, float alphaRoughness)
{
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    float GGX = GGXV + GGXL;
    if (GGX > 0.0)
    {
        return 0.5 / GGX;
    }
    return 0.0;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float D_GGX(float NdotH, float alphaRoughness)
{
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_lambertian(vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH)
{
    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    return (1.0 - specularWeight * F_Schlick(f0, f90, VdotH)) * (diffuseColor / M_PI);
}

//  https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_specularGGX(vec3 f0, vec3 f90, float alphaRoughness, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH)
{
    vec3 F = F_Schlick(f0, f90, VdotH);
    float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
    float D = D_GGX(NdotH, alphaRoughness);

    return specularWeight * F * Vis * D;
}

const float GAMMA = 2.2;
const float INV_GAMMA = 1.0 / GAMMA;

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

// ACES filmic tone map approximation
// see https://github.com/TheRealMJP/BakingLab/blob/master/BakingLab/ACES.hlsl
vec3 RRTAndODTFit(vec3 color)
{
    vec3 a = color * (color + 0.0245786) - 0.000090537;
    vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
    return a / b;
}

// linear to sRGB approximation
// see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
vec3 linearTosRGB(vec3 color)
{
    return pow(color, vec3(INV_GAMMA));
}

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

// linear to sRGB approximation
// see http://chilliant.blogspot.com/2012/08/srgb-approximations-for-hlsl.html
vec3 linearTosRGB(vec3 color)
{
    return pow(color, vec3(INV_GAMMA));
}

vec3 toneMap(vec3 color) {
    color *= 1.0;
    color = toneMapACES_Narkowicz(color);
    return linearTosRGB(color);
}

const int Directional = 0;
const int Point = 1;
const int Spot = 2;

struct Light {
    int type;
    vec3 color;
    vec3 direction;
    vec3 position;
};

in vec2 texCoord;
in vec3 fragPos;
in vec3 lightPos;
in vec4 baseColor;
in mat3 TBN;

uniform vec3 uSpecularFactor;
uniform float uGlossinessFactor;
uniform vec4 uDiffuseFactor;
uniform vec3 uEmissiveFactor;
uniform float uOcclusionStrength;
uniform float uNormalScale;
uniform vec3 uViewPos;
uniform Light uLights[1];

uniform sampler2D uDiffuseMap;
uniform sampler2D uNormalMap;
uniform sampler2D uSpecularGlossinessMap;
uniform sampler2D uEmissiveMap;
uniform sampler2D uOcclusionMap;

out vec4 fragColor;


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

    vec3 f_diffuse = vec3(0.0);
    vec3 f_specular = vec3(0.0);
    float ao = 0.0;

    vec3 lightColor = uLights[0].color;
    
    vec3 v = uViewPos - fragPos;
    float NdotV = clampedDot(n, v);
    float TdotV = clampedDot(TBN[0], v);
    float BdotV = clampedDot(TBN[1], v);
    {
        // vec3 l = lightPos - fragPos;
        // vec3 l = normalize(-uLights[0].direction);
        vec3 l = uLights[0].position - fragPos;
        // vec3 l = normalize(-vec3(-1.0, 0.0, -1.0));
        float dist = length(l);
        l = normalize(l);
        float attenuation = 1.0 / (1.0 + 0.045 * dist + 0.0075 * (dist * dist));
        // float attenuation = 1.0;
        // f_ambient *= attenuation;
        vec3 h = normalize(l + v);
        float NdotL = clampedDot(n, l);
        float NdotH = clampedDot(n, h);
        float LdotH = clampedDot(l, h);
        float VdotH = clampedDot(v, h);

        if (NdotL > 0.0 || NdotV > 0.0)
        {
            f_diffuse += lightColor * attenuation * NdotL * BRDF_lambertian(f0, f90, c_diff, specularWeight, VdotH);
            f_specular += lightColor * attenuation * NdotL * BRDF_specularGGX(f0, f90, alphaRoughness, specularWeight, VdotH, NdotL, NdotV, NdotH);
        }
    }

    vec3 f_emissive = uEmissiveFactor;
#ifdef HAS_EMISSIVE_MAP
    f_emissive *= texture(uEmissiveMap, texCoord).rgb;
#endif

#ifdef HAS_OCCLUSION_MAP
    ao = texture(uOcclusionMap, texCoord).r;
    f_diffuse = mix(f_diffuse, f_diffuse * ao, uOcclusionStrength);
    f_specular = mix(f_specular, f_specular * ao, uOcclusionStrength);
#endif

    // vec3 f_ambient = 0.3 * c_diff * attenuation;
    vec3 color = f_emissive + f_diffuse + f_specular; // + f_ambient;

    // fragColor = vec4(toneMap(color.rgb), baseColor.a);
    fragColor = vec4(color.rgb, baseDiffuse.a);
}