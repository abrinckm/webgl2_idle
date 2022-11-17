
class BasicShader extends BaseShader {
    static vsSourcePath = '/glsl/basic.vert';
    static fsSourcePath = '/glsl/basic.frag';

    render(gl) {
        if (this._init) {
            super.render(gl)
            return this._programInfo;
        }
        return null;
    }
}
