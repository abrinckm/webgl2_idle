#version 300 es

// in vec4 aVertexColor;
in vec3 aVertexPosition;

// out vec4 aColor;

void main() {
    // aColor = aVertexColor;
    gl_Position = vec4(aVertexPosition * 0.5, 1.0);
}