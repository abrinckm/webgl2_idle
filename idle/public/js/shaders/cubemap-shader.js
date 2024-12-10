/**
 * @classdesc
 * Use this class if the background environment being rendered is from an image already sliced into a cubemap (all six side flattened out to a 2D image)
 * 
 * @class
 * @extends Shader
 */
class CubeMapShader extends Shader {
    static vsSourcePath = '/glsl/cubemap.vert';
    static fsSourcePath = '/glsl/cubemap.frag';

    render(gl) {
        if (this._init) {
            super.render(gl);
            gl.uniform1i(this._programInfo.uniforms.uCubeMap, 0);
            return this._programInfo;
        }
        return null;
    }
}


/**
 * @classdesc
 * Use this class if the background environment needs to be converted from a panoramic image into a cubemap.
 * 
 * @class
 * @extends Shader
 */
class PanoramaToCubeShader extends Shader {
    static vsSourcePath = '/glsl/fullscreen.vert';
    static fsSourcePath = '/glsl/panoramaToCubemap.frag';

    render(gl) {
        if (this._init) {
            super.render(gl);
            gl.uniform1i(this._programInfo.uniforms.uPanorama, 0);
            return this._programInfo;
        }
        return null;
    }
}
