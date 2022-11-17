class CubeMap {
    constructor(shader) {
        this._shader = shader;
        this._cubeMap;
        this._buffer;

        this._vertices = [
            // positions          
            -1.0,  1.0, -1.0,
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
            -1.0,  1.0, -1.0,
        
            -1.0, -1.0,  1.0,
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0,
        
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
        
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
        
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0
        ];
    }

    load(gl, faces) {
        const targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        ]
        this._cubeMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._cubeMap);
        for (let i = 0; i < faces.length; i++) {
            gl.texImage2D(targets[i], 0, gl.RGBA, 
                2048, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            const image = new Image();
            image.onload = this._onload.bind(this, gl, image, targets[i]);
            image.src = faces[i];
        }
        // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    _onload(gl, image, target) {
        gl.texImage2D(
            target, 0, gl.RGBA, image.width, image.height, 
            0, gl.RGBA, gl.UNSIGNED_BYTE, image
        );
    }

    initialize(gl, init=true) {
        this._buffer = gl.createBuffer();
        this._shader.initialize(gl);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this._shader._programInfo.attributes.aVertexPosition);
        delete this._vertices;
        this._init = init;
    }
    
    render(gl) {
        if(this._init) {
            const programInfo = this._shader.render(gl);
            if (programInfo) {
                GameState.camera.render(gl, programInfo);
                gl.depthMask(false);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
                gl.vertexAttribPointer(
                    programInfo.attributes.aVertexPosition,
                    3, gl.FLOAT, false, 0, 0
                );
                gl.drawArrays(gl.TRIANGLES, 0, 36);
                gl.depthMask(true);
            }
        }
    }
}


class EnvironmentMap {
    constructor() {
        this._envMap = null;
    }

    async load(gl, source) {
        const self = this;
        return new Promise(resolve => {
            const req = new XMLHttpRequest();
            req.responseType = "arraybuffer";
            req.addEventListener("load", self._onload.bind(self, req, gl, resolve), false);
            req.open("GET", source);
            req.send();
        });
    }

    _onload(req, gl, resolve) {
        this._envMap = gl.createTexture();
        const buffer = new Uint8Array(req.response);
        this._hdr = HDRLoader.loadHDR(buffer);
        
        gl.bindTexture(gl.TEXTURE_2D, this._envMap);

        //TODO(Adam): Switch formats on what is supported by client
        // let format = this.use8bit ? gl.RGB : gl.RGB32F;
        
        if (BaseShader.anisotropySupported) {
            gl.texParameterf(gl.TEXTURE_2D, BaseShader.anisotropy, BaseShader.maxAnisotropy);
        }

        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGB32F, this._hdr.width,
            this._hdr.height, 0, gl.RGB, gl.FLOAT, this._hdr.dataFloat
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        resolve(true);
    }

    generateCubeMap(gl, shader, resolution, withMipmap=true) {
        if (!shader._init) {
            shader.initialize(gl);
        }

        const captureFBO = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);

        const envCubemap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

        // TODO(Adam): figure out formats based on what extensions are supported in the client browser
        for (let i = 0; i < 6; ++i) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA32F, 
                resolution, resolution, 0, gl.RGBA, gl.FLOAT, null
            );
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (withMipmap) {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        }
        else {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
        gl.viewport(0, 0, resolution, resolution); // don't forget to configure the viewport to the capture dimensions.
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._envMap);
        shader.render(gl);

        for (let i = 0; i < 6; ++i) {
            gl.uniform1i(programInfo.uniforms.uCurrentFace, i);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0
            );
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        return envCubemap;
    }
}