/**
 * @classdesc
 * The Base Shader class for all shaders.
 * This is responsible for loading shader source, linking and compiling the code, and loading the source 
 * into a WebGL datastructure ready to be shipped to the GPU. The class also creates an interface that gives 
 * client code access to memory locations for key shader variables. This interface is used to initialize the shader variables
 * used in rendering different material and lighting effects.
 * 
 * @class
 */
class Shader {
    static vsSource;
    static fsSource;
    static vsSourcePath;
    static fsSourcePath;

    /**
     * @constructor
     */
    constructor() {
        const cls = this.constructor;
        this._vsSource = cls.vsSource + "";
        this._fsSource = cls.fsSource + "";
        this._init = false;
        this._programInfo = {
            uniforms: {},
            attributes: {}
        };
        this._instance = null;
    }

    /**
     * Load the shader source code. The URI of the source code is controlled by the client to the child class.
     * @static
     * @async
     * @returns {Promise<null>}
     */
    static async loadShaders() {
        const reqBuffers = {vs: new XMLHttpRequest(), fs: new XMLHttpRequest()}
        const self = this
        return new Promise(resolve => {
            function loadFSSource(e) {
                self.fsSource = reqBuffers.fs.responseText
                self.peekPos = self.fsSource.indexOf('\n')
                self.version = self.fsSource.substring(0, self.peekPos)
                resolve()
            }
            function loadVSSource(e) {
                self.vsSource = reqBuffers.vs.responseText
            }
            function loadSource(req, path, callback) {
                req.addEventListener("load", callback, false);
                req.open("GET", path);
                req.send();
            }
            loadSource(reqBuffers.vs, self.vsSourcePath, loadVSSource)
            loadSource(reqBuffers.fs, self.fsSourcePath, loadFSSource)
        })
    }

    /**
     * Compiles the shader source to check for syntax errors. Links the source. Creates a WebGL program datastructure to hold the linked shader code.
     * Gathers all of the shader's attribute and uniform variables and their memory locations. Creates and exposes an interface that 
     * has the memory locations for the shader variables. These variables are assigned values by client code later during the rendering process.
     * @param {WebGL2RenderingContext} gl WebGL context
     * @returns {null}
     */
    initialize(gl) {
        const vertexShader = this._compileShader(gl, gl.VERTEX_SHADER, this._vsSource);
        const fragmentShader = this._compileShader(gl, gl.FRAGMENT_SHADER, this._fsSource);
        
        this._shaderProgram = gl.createProgram();
        gl.attachShader(this._shaderProgram, vertexShader);
        gl.attachShader(this._shaderProgram, fragmentShader);
        gl.linkProgram(this._shaderProgram);
        
        if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
            alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(this._shaderProgram)}`);
            return null;
        }

        const uniformCount = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_UNIFORMS);
        for(let i = 0; i < uniformCount; ++i) 
        {
            const info = gl.getActiveUniform(this._shaderProgram, i);
            const loc = gl.getUniformLocation(this._shaderProgram, info.name);
            this._programInfo.uniforms[info.name] = loc;
        }

        const attribCount = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_ATTRIBUTES);
        for(let i = 0; i < attribCount; ++i)
        {
            const info = gl.getActiveAttrib(this._shaderProgram, i);
            const loc = gl.getAttribLocation(this._shaderProgram, info.name);
            this._programInfo.attributes[info.name] = loc;
        }

        this._init = true;
    }

    /**
     * @typedef {Object.<string,number>} MemLoc
     */

    /**
     * @typedef {Object} ProgramInfo
     * @property {MemLoc[]} attributes
     * @property {MemLoc[]} uniforms
     */

    /**
     * Getter for the program info interface
     * @returns {ProgramInfo}
     */
    programInfo() {
        return this._programInfo;
    }

    /**
     * Insert a shader definition. These are normally used to signal that specific material attributes need to be processed by the shader.
     * @param {string} constant The name of the defined variable.
     */
    define(constant) {
        const cls = this.constructor
        this._fsSource = cls.version + `\n#define ${constant}` + this._fsSource.slice(cls.peekPos)
        this._vsSource = cls.version + `\n#define ${constant}` + this._vsSource.slice(cls.peekPos)
    }

    /**
     * Creates a WebGLShader datastructure and loads source code into this datastructure. Compiles the code to check for syntax errors. Prepares
     * the shader to be shipped to the GPU.
     * @param {WebGL2RenderingContext} gl WebGL context
     * @param {string} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {string} source The plain text glsl source code
     * @returns {WebGLShader} Shader ready to be shipped to the GPU
     */
    _compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Tell WebGL to ship this shader to the GPU
     * @param {WebGL2RenderingContext} gl WebGL context 
     */
    render(gl) {
        gl.useProgram(this._shaderProgram);
    }
}
