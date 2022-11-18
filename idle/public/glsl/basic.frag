#version 300 es

// uniform mediump vec4 uColor;
in mediump vec4 aColor;

out mediump vec4 fragColor;

void main() {
    fragColor = aColor;
}