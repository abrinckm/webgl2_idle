
class CubeMapShader extends BaseShader {
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


class PanoramaToCubeShader extends BaseShader {
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