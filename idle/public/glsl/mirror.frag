#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

in vec3 vPosition;
in vec3 vNormal;

uniform samplerCube skybox;
uniform vec3 viewPos;

out vec4 fragColor;

void main() {
    vec3 I = normalize(vPosition - viewPos);
    vec3 R = reflect(I, normalize(vNormal));
    fragColor = vec4(texture(skybox, R).rgb, 1.0);
}