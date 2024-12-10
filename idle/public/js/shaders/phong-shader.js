/**
 * @classdesc
 * Phong is one of the first heuristics used to render lights and material surfaces. It is the most basic and least expensive shader. Good to use
 * for materials that don't require advanced rendering techniques or require photorealistic rendering. For example, this would be good for rendering
 * objects from a distance (distant landscape) where details cannot be seen.
 * 
 * @class
 * @extends Shader
 */
class PhongShader extends Shader {
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
