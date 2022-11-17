#version 300 es

precision highp float;

out vec2 texCoord;
out vec3 vPosition;

void main(void) 
{
    float x = float((gl_VertexID & 1) << 2);
    float y = float((gl_VertexID & 2) << 1);
    texCoord.x = x * 0.5;
    texCoord.y = y * 0.5;
    vPosition = vec3(x - 1.0, y - 1.0, 0);
    gl_Position = vec4(vPosition, 1);
}
