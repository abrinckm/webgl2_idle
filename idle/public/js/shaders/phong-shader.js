
class PhongShader extends BaseShader {
    static vsSourcePath = '/glsl/phong.vert'
    static fsSourcePath = '/glsl/phong.frag'

    render(gl) {
        if (this._init) {
            super.render(gl)
            gl.uniform1i(programInfo.uniforms.uDiffuseMap, 0);
            gl.uniform1i(programInfo.uniforms.uNormalMap, 1);
            return programInfo
        }
        return null;
    }
}
