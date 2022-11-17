#version 300 es

in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;
in vec4 aTangent;

uniform mat4 umodelMatrix;
uniform mat4 uProjectionMatrix;

out vec2 texCoord;
out vec3 fragPos;
out vec3 lightPos;
out vec3 viewPos;

void main() {
    gl_Position = uProjectionMatrix * umodelMatrix * aVertexPosition;
    texCoord = aTextureCoord;
    vec3 T = normalize(vec3(umodelMatrix * vec4(aTangent.xyz, 0.0)));
    vec3 N = normalize(vec3(umodelMatrix * vec4(aVertexNormal.xyz, 0.0)));
    vec3 B = cross(N, T) * aTangent.w;
    mat3 TBN = transpose(mat3(T, B, N));
    lightPos = TBN * vec3(3.85, 1.0, 3.0);
    fragPos = TBN * vec3(umodelMatrix * aVertexPosition);
    viewPos = TBN * vec3(0.0, 0.0, 0.0);
}