#version 300 es

uniform mediump vec4 uColor;

in mediump vec4 normal;

out mediump vec4 fragColor;

void main() {
    mediump vec3 norm = normalize(normal).xyz;
    mediump vec3 lightColor = vec3(1.0, 1.0, 1.0);

    mediump vec3 lightDir = -normalize(vec3(0.85, 0.8, 0.75));
    mediump float diff = max(dot(norm, lightDir), 0.0);
    mediump vec3 diffuse = diff * lightColor;

    mediump vec3 result = diffuse * vec3(uColor.rgb);

    fragColor = vec4(result, uColor.a);
}