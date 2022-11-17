#version 300 es

in vec4 aVertexPosition;
in vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

out vec3 vPosition;
out vec3 vNormal;

void main() {
    vNormal = mat3(uModelMatrix) * aNormal;
    vPosition = vec3(uModelMatrix * aVertexPosition);
    gl_Position = vec4(uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition);
}