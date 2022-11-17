#version 300 es

uniform float uTheta;
uniform mat4 uProjectionMatrix;

in vec3 aVertexPosition;

void main() {
    float x = aVertexPosition.x;
    float y = aVertexPosition.y;
    float z = aVertexPosition.z;

    vec4 position;
    position.x = x * cos(uTheta) - y * sin(uTheta);
    position.y = x * sin(uTheta) + y * cos(uTheta);
    position.z = z;
    position.w = 1.0;

    position = uProjectionMatrix * position;
    gl_Position = vec4(position);
}