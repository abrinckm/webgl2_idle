#version 300 es

in vec4 aVertexPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 texCoord;

void main() {
    texCoord = aVertexPosition.rgb;
    mat4 skyMatrix = mat4(mat3(uViewMatrix)); 
    gl_Position = vec4(uProjectionMatrix * skyMatrix * aVertexPosition).xyww;
}