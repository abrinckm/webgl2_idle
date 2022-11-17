DEG_TO_RADIANS = Math.PI / 180

async function main() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");

    // Vertices for a triangle
    let vertices = [
        -1.0, 1.0, -5.0,
        -1.0, -1.0, -5.0,
        1.0, -1.0, -5.0,
    ];

    // Indices to tell the GPU in which order to render the vertices
    let indices = [0, 1, 2]
    
    // Compile the shaders
    await BasicShader.loadShaders();
    let basicShader = new BasicShader();
    basicShader.initialize(gl);
    let programInfo = basicShader.programInfo();

    // Ship the shader programs to the GPU
    gl.useProgram(basicShader._shaderProgram);    
    
    let vertexBuffer = null;
    let indexBuffer = null;

    ///
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    gl.uniformMatrix4fv(programInfo.uniforms.uProjectionMatrix, false, projectionMatrix);
    ///

    {
        // Ship indices and vertex data to the GPU
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        
        // Set Colors
        let color = new Float32Array([0.0, 1.0, 0.0, 1.0]);  // GREEN
        gl.uniform4fv(programInfo.uniforms.uColor, color);
        
        // Draw triangle
        gl.vertexAttribPointer(programInfo.attributes.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attributes.aVertexPosition);
        
        gl.viewport(0, 0, 1280, 720);

        let theta = 0.0;
        function flipBook() {
            // Paint the canvas black
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            theta += .1 * DEG_TO_RADIANS;
            theta %= 365;
            gl.uniform1f(programInfo.uniforms.uTheta, theta);

            gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

            window.requestAnimationFrame(flipBook);
        }

        window.requestAnimationFrame(flipBook);
    }
}


main();
