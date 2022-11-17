class Texture {
    constructor(mag_filter, min_filter, wrap_s, wrap_t) {
        this._mag_filter = mag_filter
        this._min_filter = min_filter
        this._wrap_s = wrap_s
        this._wrap_t = wrap_t
        this._texture = null;
    }

    load(gl, source) {
        const image  = new Image();
        image.onload = this._onload.bind(this, gl, image)
        image.src = source;
    }

    set(gl, image) {
        this._onload(gl, image)
    }

    _onload(gl, image) {
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);
    
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (this._isPowerOf2(image.width) && this._isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } 
        else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrap_s);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrap_t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._min_filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._mag_filter);
        }
        this._init = true;
    }

    texture() {
        return this._texture;
    }

    render(gl, textureUnit) {
        if (this._init) {
            gl.activeTexture(textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
        }
    }

    _isPowerOf2(value) {
        return (value & (value - 1)) == 0;
    }
}