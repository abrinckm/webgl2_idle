#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

//include <tonemap.glsl>

in vec3 texCoord;

uniform samplerCube uCubeMap;

out vec4 fragColor;

void main() {
    vec3 envColor = texture(uCubeMap, texCoord).rgb;
    // envColor /= 0.6;
    // envColor = toneMapACES_Hill(envColor);
    envColor = toneMapACES_Narkowicz(envColor);
    envColor = linearTosRGB(envColor);
    fragColor = vec4(envColor, 1.0);
}