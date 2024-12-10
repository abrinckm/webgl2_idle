/**
 * @classdesc
 * Use this shader if you want to render the object as a perfect mirror ignoring all other textures and material attributes.
 * 
 * @class
 * @extends Shader
 */
class MirrorShader extends Shader {
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
