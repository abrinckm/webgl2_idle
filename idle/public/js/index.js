async function main() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");

    // Vertices for a triangle
    let vertices = [
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
    ];

    let colors = [
        1.0, 1.0, 0.0, 1.0,  // Yellow
        0.0, 0.0, 1.0, 1.0,  // Blue
        1.0, 0.0, 0.0, 1.0,  // Red
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
    {
        // Ship indices and vertex data to the GPU
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        // Colors
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        // Paint the canvas black
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        
        // Set Colors
        // let color = new Float32Array([0.0, 1.0, 0.0, 1.0]);  // GREEN
        // gl.uniform4fv(programInfo.uniforms.uColor, color);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(programInfo.attributes.aVertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attributes.aVertexColor);
        
        // Draw triangle
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(programInfo.attributes.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attributes.aVertexPosition);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    }
}


main();
