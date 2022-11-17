class BaseShader {
    static vsSource;
    static fsSource;
    static vsSourcePath;
    static fsSourcePath;

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

    initialize(gl) {
        const vertexShader = this._loadShader(gl, gl.VERTEX_SHADER, this._vsSource);
        const fragmentShader = this._loadShader(gl, gl.FRAGMENT_SHADER, this._fsSource);
        
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

    programInfo() {
        return this._programInfo;
    }

    define(constant) {
        const cls = this.constructor
        this._fsSource = cls.version + `\n#define ${constant}` + this._fsSource.slice(cls.peekPos)
        this._vsSource = cls.version + `\n#define ${constant}` + this._vsSource.slice(cls.peekPos)
    }

    _loadShader(gl, type, source) {
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

    render(gl) {
        gl.useProgram(this._shaderProgram);
    }
}