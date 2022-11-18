#version 300 es

uniform mediump vec4 uColor;

out mediump vec4 fragColor;

void main() {
    fragColor = vec4(uColor.rgb, uColor.a);
}