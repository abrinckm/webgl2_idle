
class MirrorShader extends BaseShader {
    static vsSourcePath = '/glsl/mirror.vert';
    static fsSourcePath = '/glsl/mirror.frag';

    render(gl) {
        if (this._init) {
            super.render(gl)
            return this._programInfo;
        }
        return null;
    }
}
