#version 300 es

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

in vec3 aVertexPosition;
in vec3 aNormalPosition;

out vec4 normal;

void main() {
    vec4 position = vec4(aVertexPosition, 1.0);
    normal = uModelViewMatrix * vec4(aNormalPosition, 1.0);
    position = uProjectionMatrix * uModelViewMatrix * position;
    gl_Position = position;
}