#version 300 es

in vec3 aVertexPosition;

void main() {
    gl_Position = vec4(aVertexPosition * 0.5, 1.0);
}