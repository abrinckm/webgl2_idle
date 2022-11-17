#version 300 es

in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord0;
in vec4 aTangent;
#ifdef HAS_BASE_COLOR
in vec4 aBaseColor;
#endif

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 texCoord;
out vec3 fragPos;
out vec4 baseColor;
out mat3 TBN;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
#ifdef HAS_BASE_COLOR
    baseColor = aBaseColor;
#endif
    texCoord = aTextureCoord0;
    vec3 T = normalize(vec3(uModelMatrix * vec4(aTangent.xyz, 0.0)));
    vec3 N = normalize(vec3(uModelMatrix * vec4(aVertexNormal.xyz, 0.0)));
    vec3 B = cross(N, T) * aTangent.w;
    TBN = mat3(T, B, N);
    fragPos = vec3(uModelMatrix * aVertexPosition);
}