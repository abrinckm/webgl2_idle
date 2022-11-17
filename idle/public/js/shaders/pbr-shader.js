
class PBRShader extends BaseShader {
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
