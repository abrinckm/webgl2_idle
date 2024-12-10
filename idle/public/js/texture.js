/**
 * @classdesc
 * Texture stores the image binary itself as well as information that describes to WebGL how to wrap the texture to a surface.
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
 * 
 * @class
 */
class Texture {
    /**
     * @constructor
     * @param {GLenum} mag_filter Texture magnification filter
     * @param {GLenum} min_filter Texture minification filter
     * @param {GLenum} wrap_s Wrapping function for texture coord S
     * @param {GLenum} wrap_t Wrapping function for texture coord T
     */
    constructor(mag_filter, min_filter, wrap_s, wrap_t) {
        this._mag_filter = mag_filter
        this._min_filter = min_filter
        this._wrap_s = wrap_s
        this._wrap_t = wrap_t
        this._texture = null;
    }

    /**
     * Given a URI, download the image data the client browser.
     * @param {WebGL2RenderingContext} gl 
     * @param {string} source URI for the image
     */
    load(gl, source) {
        const image  = new Image();
        image.onload = this._onload.bind(this, gl, image)
        image.src = source;
    }

    /**
     * Sets image data.
     * Precondition: Image already downloaded.
     * @param {WebGL2RenderingContext} gl 
     * @param {Image} image 
     */
    set(gl, image) {
        this._onload(gl, image)
    }

    /**
     * Event callback. Called after the image has fully downloaded.
     * Creates a WebGLTexture and copies the image data and parameters into this new datastructure.
     * A WebGLTexture is a type of datastructure that can be shipped into VRAM during rendering.
     * @param {WebGL2RenderingContext} gl 
     * @param {Image} image An HTML image source.
     */
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

    /**
     * Getter
     * @returns {WebGLTexture}
     */
    texture() {
        return this._texture;
    }

    /**
     * Tell WebGL to ship this texture data to VRAM.
     * @param {WebGL2RenderingContext} gl 
     * @param {*} textureUnit 
     */
    render(gl, textureUnit) {
        if (this._init) {
            gl.activeTexture(textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
        }
    }

    /**
     * Cheap way to determine if a number is a power of 2
     * @param {number} value 
     * @returns {boolean}
     */
    _isPowerOf2(value) {
        return (value & (value - 1)) == 0;
    }
}
