#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

in vec2 texCoord;
in vec3 fragPos;
in vec3 lightPos;
in vec3 viewPos;

uniform vec4 uDiffuseFactor;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;

out vec4 fragColor;

void main() {
    vec4 texelColor = uDiffuseFactor * texture(diffuseMap, texCoord);

    vec3 normal = texture(normalMap, texCoord).rgb;
    vec3 lightColor = vec3(1.5, 1.5, 1.5);
    normal = normal * 2.0 - 1.0;
    // normal *= (2.0 * float(gl_FrontFacing) - 1.0); // NOTE(Adam): Flip backfacing normals?
    
    vec3 lightDir = normalize(lightPos - (fragPos));
    float dirLight = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = dirLight * lightColor;

    float specularStrength = 0.5;
    
    vec3 viewDir = normalize(viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
    vec3 specular = specularStrength * spec * lightColor;

    fragColor = vec4((vec3(0.0, 0.0, 0.0) + diffuse + specular), 1.0) * texelColor;
}