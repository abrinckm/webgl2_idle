DEG_TO_RADIANS = Math.PI / 180

async function main() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");

    // // Vertices for a triangle
    let vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
      
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
      
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
      
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
      
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
      
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    const normals = [
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    
        // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
    
        // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
    
        // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
    
        // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
    
        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];

    const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

      
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
        let modelViewMatrix = mat4.create();
        let rotation = quat.create();
        // Ship indices and vertex data to the GPU
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        
        // Set Colors
        let color = new Float32Array([0.0, 1.0, 0.0, 1.0]);  // GREEN
        gl.uniform4fv(programInfo.uniforms.uColor, color);
        
        // Draw triangle
        gl.enableVertexAttribArray(programInfo.attributes.aVertexPosition);
        gl.enableVertexAttribArray(programInfo.attributes.aNormalPosition);
        
        gl.viewport(0, 0, 1280, 720);
        
        quat.fromEuler(rotation, 0, 0.0, 0.0, 0.0);
        let translation = vec3.fromValues(0.0, -1.0, -10.0);
        let scale = vec3.fromValues(1.0, 1.0, 1.0);
        
        mat4.fromRotationTranslationScale(
            modelViewMatrix, 
            rotation,
            translation,
            scale
        );
            
        let theta = 0.0;
        function flipBook() {
                // Paint the canvas black
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            mat4.rotateY(modelViewMatrix, modelViewMatrix, 0.1 * DEG_TO_RADIANS);
            mat4.rotateZ(modelViewMatrix, modelViewMatrix, 0.1 * DEG_TO_RADIANS);
            gl.uniformMatrix4fv(programInfo.uniforms.uModelViewMatrix, false, modelViewMatrix);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(programInfo.attributes.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.vertexAttribPointer(programInfo.attributes.aNormalPosition, 3, gl.FLOAT, false, 0, 0);

            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            
            window.requestAnimationFrame(flipBook);
        }
        
        window.requestAnimationFrame(flipBook);
    }
}


main();
