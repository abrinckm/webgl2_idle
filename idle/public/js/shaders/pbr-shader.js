/**
 * @classdesc
 * The physically based rendering (PBR) shader is used for most assets. The shader heuristically renders lights and material surfaces to be as photorealistic as possible.
 * This is going to be the most expensive shader in terms of VRAM for textures and also in terms of computation for the many heuristic algorithms used to make the
 * rendering details photorealistic.
 * 
 * @class
 * @extends Shader
 */
class PBRShader extends Shader {
    static vsSourcePath = '/glsl/pbr.vert';
    static fsSourcePath = '/glsl/pbr.frag';

    render(gl) {
        if (this._init) {
            super.render(gl)
            // TODO(Adam): Consider moving this out into materials
            gl.uniform1i(this._programInfo.uniforms.uDiffuseMap, 0);
            gl.uniform1i(this._programInfo.uniforms.uNormalMap, 1);
            gl.uniform1i(this._programInfo.uniforms.uSpecularGlossinessMap, 2);
            gl.uniform1i(this._programInfo.uniforms.uEmissiveMap, 3);
            gl.uniform1i(this._programInfo.uniforms.uOcclusionMap, 4);
            return this._programInfo;
        }
        return null;
    }
}
