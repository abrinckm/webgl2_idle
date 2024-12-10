/**
 * @classdesc
 * To put in overly simplistic terms - a material is something that stores all of the data a shader program will use to calculate the color of a pixel on the screen.
 * Most of the data is stored as 2D textures. Shaders generally use the "UV Wrapping" technique to map a 2D texture coordinate to a pixel on the screen.
 * The properties of a material are:
 * - shader The shader programs used to plot and color a pixel. The shader always has 2 separate programs: vertex (plot), fragment (color).
 *          There are different shader programs for different purposes (e.g., mirroring effect, phong effect, pbr effect, panaroma to cube, radiance effect, etc.)
 * - diffuseMap
 * - normalMap 
 * - specularGlossinessMap
 * - occlusionMap
 * - normalScale 
 * - specularFactor
 * - glossinessFactor 
 * - diffuseFactor 
 * - emissiveFactor
 * - occlusionStrength
 * @class
 */
class Material {
    /**
     * @constructor
     * @param {Shader} shader The shader program used for painting this object on screen.
     */
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

    /**
     * setter
     * @param {number} normalScale A global scalar value. This value is multiplied against the angle of incidence for each pixel. Primarily used only if you have many 
     *   of the same texture in the scene, and need a cheap way to make them look different (e.g., a bunch of rocks of the same texture and need to look different from 
     *   each other to be more realistic).
     */
    uNormalScale(normalScale) {
        this._uNormalScale = normalScale;
    }

    /**
     * setter
     * @param {vec4} uDiffuseFactor A global 4D vector with RGBA color channels. Multiplied by the diffuse value for each pixel. Adjusts what color channels are absorbed 
     *   and/or scattered. High values result in a matte look, while lower values result in a more polished look. Generally, all materials have a measure of diffusion unless
     *   it is a cold and highly polished metal like silver or stainless steel.
     */
    uDiffuseFactor(uDiffuseFactor) {
        this._uDiffuseFactor = uDiffuseFactor;
    }

    /**
     * setter
     * @param {number} emissiveFactor A global 3D vector with RGB color channels. Adjusts how much light is emitted from the object.
     */
    uEmissiveFactor(emissiveFactor) {
        this._uEmissiveFactor = emissiveFactor;
    }

    /**
     * setter
     * @param {vec3} uSpecularFactor A global 3D vector with RGB color channels. Multiplied by the specular value for each pixel. Adjusts how much of each color channel 
     *   is reflected in specular lighting.
     */
    uSpecularFactor(uSpecularFactor) {
        this._uSpecularFactor = uSpecularFactor;
    }

    /**
     * setter
     * @param {number} uGlossinessFactor A global scalar value that is multiplied against the glossiness value per pixel. Adjusts the intensity of specular lighting for an object.
     */
    uGlossinessFactor(uGlossinessFactor) {
        this._uGlossinessFactor = uGlossinessFactor;
    }

    /**
     * setter
     * @param {number} strength A global scalar value. Adjusts the intensity of the effect of fake indirect lighting.
     */
    uOcclusionStrength(strength) {
        this._uOcclusionStrength = strength;
    }

    /**
     * setter
     * @param {Texture} uDiffuseMap Texture data that maps paint information for each point. Determines what light is reflected/absorbed per pixel. This is the main texture file with 
     *   the image to be painted on the model.
     */
    addDiffuseMap(uDiffuseMap) {
        this._uDiffuseMap = uDiffuseMap;
        this._shader.define('HAS_DIFFUSE_MAP');
    }
    
    /**
     * setter
     * @param {Texture} uNormalMap Texture data that maps the angle of incidence for each point. The angle of incidence determines the angle of light that is reflected off 
     *   the surface. This helps give the illusion of 3D lighting for 2D textures. (AKA bump map, because it makes 2D textures look "bumpy").
     */
    addNormalMap(uNormalMap) {
        this._uNormalMap = uNormalMap;
        this._shader.define('HAS_NORMAL_MAP');
    }

    /**
     * setter
     * @param {Texture} uEmissiveMap Texture data that maps the color of light emitted for each point.
     */
    addEmissiveMap(uEmissiveMap) {
        this._uEmissiveMap = uEmissiveMap;
        this._shader.define("HAS_EMISSIVE_MAP");
    }
    
    /**
     * setter
     * @param {Texture} uSpecularGlossinessMap Texture data that maps specular glossiness (AKA alpha roughness) for each pixel. Specular light is a function of the viewing angle 
     * to a reflected light source from the surface of an object. A polished ceramic marble is highly specular. A piece of paper has little to no specular lighting.
     */
    addSpecularGlossinessMap(uSpecularGlossinessMap) {
        this._uSpecularGlossinessMap = uSpecularGlossinessMap;
        this._shader.define('HAS_SPECULAR_GLOSSINESS_MAP');
    }
    
    /**
     * setter
     * @param {Texture} uOcclusionMap Texture data that maps how much shadow a pixel should receive (inversely, how much indirect lighting it should receive). 
     *   This gives the illusion that the 2D texture is casting shadows on itself.
     */
    addOcclusionMap(uOcclusionMap) {
        this._uOcclusionMap = uOcclusionMap;
        this._shader.define('HAS_OCCLUSION_MAP');
    }

    /**
     * Pass the gl context down into the shader program for initialization.
     * @param {WebGL2RenderingContext} gl (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     */
    initialize(gl) {
        this._shader.initialize(gl);
        this._init = true;
    }

    /**
     * @typedef {Object} ProgramInfo
     * @property {Object.<string, number>[]} uniforms The WebGL location of shader uniform variables. Global constants in the shader program.
     * @property {Object.<string, number>[]} attributes The WebGL location of shader attribute variables. Attributes vary in value for each pixel.
     */

    /**
     * Links all material global variables to the shader program before shipping the shader to the GPU. Also binds texture data to VRAM.
     * @param {WebGL2RenderingContext} gl (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     * @returns {ProgramInfo} Shader program info. See the Mesh class on how program info is used to activate specific shader variables before sending draw commands to the GPU.
     */
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
