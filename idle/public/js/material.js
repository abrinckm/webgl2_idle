class Material {
    constructor(shader) {
        this._init = false;
        this._shader = shader;
        this._uDiffuseMap = null;
        this._uNormalMap = null;
        this._uNormalScale = 1.0;
        this._uSpecularGlossinessMap = null;
        this._uOcclusionMap = null;
        this._uSpecularFactor = [1.0, 1.0, 1.0];
        this._uGlossinessFactor = 1.0;
        this._uDiffuseFactor = [1.0, 1.0, 1.0, 1.0];
        this._uEmissiveFactor = [0.0, 0.0, 0.0];
        this._uOcclusionStrength = 1.0;
    }

    uNormalScale(normalScale) {
        this._uNormalScale = normalScale;
    }

    uDiffuseFactor(uDiffuseFactor) {
        this._uDiffuseFactor = uDiffuseFactor;
    }

    uEmissiveFactor(emissiveFactor) {
        this._uEmissiveFactor = emissiveFactor;
    }

    uSpecularFactor(uSpecularFactor) {
        this._uSpecularFactor = uSpecularFactor;
    }

    uGlossinessFactor(uGlossinessFactor) {
        this._uGlossinessFactor = uGlossinessFactor;
    }

    uOcclusionStrength(strength) {
        this._uOcclusionStrength = strength;
    }

    addDiffuseMap(uDiffuseMap) {
        this._uDiffuseMap = uDiffuseMap;
        this._shader.define('HAS_DIFFUSE_MAP');
    }
    
    addNormalMap(uNormalMap) {
        this._uNormalMap = uNormalMap;
        this._shader.define('HAS_NORMAL_MAP');
    }

    addEmissiveMap(uEmissiveMap) {
        this._uEmissiveMap = uEmissiveMap;
        this._shader.define("HAS_EMISSIVE_MAP");
    }
    
    addSpecularGlossinessMap(uSpecularGlossinessMap) {
        this._uSpecularGlossinessMap = uSpecularGlossinessMap;
        this._shader.define('HAS_SPECULAR_GLOSSINESS_MAP');
    }
    
    addOcclusionMap(uOcclusionMap) {
        this._uOcclusionMap = uOcclusionMap;
        this._shader.define('HAS_OCCLUSION_MAP');
    }

    initialize(gl) {
        this._shader.initialize(gl);
        this._init = true;
    }

    render(gl) {
        if (this._init) {
            let programInfo = this._shader.render(gl);
            if (programInfo) {
                gl.uniform4fv(programInfo.uniforms.uDiffuseFactor, this._uDiffuseFactor);
                gl.uniform3fv(programInfo.uniforms.uSpecularFactor, this._uSpecularFactor);
                gl.uniform1f(programInfo.uniforms.uGlossinessFactor, this._uGlossinessFactor);
                if (this._uDiffuseMap) {
                    this._uDiffuseMap.render(gl, gl.TEXTURE0);
                }
                if (this._uNormalMap) {
                    this._uNormalMap.render(gl, gl.TEXTURE1);
                    gl.uniform1f(programInfo.uniforms.uNormalScale, this._uNormalScale);
                }
                if (this._uSpecularGlossinessMap) {
                    this._uSpecularGlossinessMap.render(gl, gl.TEXTURE2);
                }
                if (this._uEmissiveMap) {
                    this._uEmissiveMap.render(gl, gl.TEXTURE3);
                }
                if (this._uOcclusionMap) {
                    this._uOcclusionMap.render(gl, gl.TEXTURE4);
                    gl.uniform1f(programInfo.uniforms.uOcclusionStrength, this._uOcclusionStrength);
                }
            }
            return programInfo;
        }
        return null;
    }
}