/**
 * @classdesc
 * MeshPrimitiveAttribute is a datastructure that holds information describing how to read primitive attribute data from a given vertex buffer (array of vertices). 
 * 
 * A primitive is a small array of vertices that make up a flat 2D surface. Each vertex in a primitive have 1 or more attributes. Vertex attributes are used
 * by shaders to paint the surface of a primitive. Shaders determine point and color of every pixel by interpolating the values between the vertices of the primitive.
 * 
 * A mesh primitive attribute can be one of the following:
 * - POSITION The 3D position of the vertex when the mesh was modeled. 
 * - COLOR The color of the vertex. This is only used if the material does not have a diffuse texture. Shaders determine the color of a pixel between vertices by interpolating 
 *         the values of the vertices. This creates a gradient coloring effect.
 * - NORMAL The normal vector of the vertex. Used to calculate angle of incidence for light reflection. Interpolating the angle creates a gradiant shading effect
 *          across primitive boundaries on the surface of 3D object making it apper very smooth with no angles.
 * - TANGENT Tangent of a vertex. Bi-tangent is calculated given a normal vector and tangent vector of a vertex. Tangents and Bi-tangents are vectors used to define the local 
 *           coordinate system of a surface. This is primarily used in conjunction with normal maps to calculate how light should refract or reflect from the surface point. 
 *           Tangents are only useful if the material has a normal map texture.
 * - TEXTURE The UV coordinates for the vertex. UV coordinates map to an (x,y) coordinate on the 2D texture image. UV coords are interpolated between between vertices to 
 *           find the correct color from the image to paint the pixel on the primitive surface.
 * - INDICES These determine which POSITION vertices should be drawn for the primitive and in what order.
 * @class
 */
class MeshPrimitiveAttribute {
    /**
     * @constructor
     * @param {number} bufferViewIdx The buffer view this datastructure describes
     * @param {GLenum} target For an attribute, this will almost always be gl.ARRAY_BUFFER. For element indices, this will be gl.ELEMENT_ARRAY_BUFFER
     * @param {GLint} components Number of components (dimensions) per vector.
     * @param {GLenum} type The data type for each component
     * @param {GLsizei} stride The stride in bytes between attributes (sometimes multiple attributes are interlaced in a single array)
     * @param {GLintptr} offset Offset in bytes to the first component
     * @param {GLsizei} count The number of elements to be rendered.
     */
    constructor(
        bufferViewIdx,
        target,
        components,
        type,
        stride,
        offset,
        count=0,
    ) {
        this.bufferViewIdx = bufferViewIdx;
        this.target = target;
        this.components = components;
        this.type = type;
        this.stride = stride;
        this.offset = offset;
        this.count = count;
    }
}


/**
 * @classdesc
 * 3D objects are made up of primitives.
 * The most common primitive used in computer graphics is the triangle. In fact, GPU hardware is designed to be able to process >2M triangles per second.
 * This class stores the attribute metadata, texture UV coordinates, and the order (indices) in which to draw the vertices to render the 3D primitive. The GPU makes a 
 * decision about whether to draw the primitive based on whether it is "front-facing" or "back-facing". For a triangle to be "front-facing", vertices are drawn in counter-clockwise
 * order. If the primitive is rotated around so that the front is away from the viewer, the order (set by the indices), becomes clockwise or "Back-facing". Back-facing triangles
 * are not rendered to the screen.
 * 
 * @class
 */
class MeshPrimitive {
    /**
     * @constructor
     * @param {GLenum} mode How it should be drawn: line, line strips, triangles, points (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements)
     * @param {MeshPrimitiveAttribute} indices Description of how to read element indices from the vertex buffer. Indices are pointers to the vertices of the mesh and in what
     *                                         order they are drawn.
     */
    constructor(mode, indices) {
        this._mode = mode;
        this._indices = indices;
        this._attributes = {};
        this._texCoords = {};
        this._bound = false;
    }

    /**
     * Add a mesh primitive attribute.
     * @param {string} type COLOR, POSITION, NORMAL, TANGENT
     * @param {MeshPrimitiveAttribute} attribute The mesh primitive attribute metadata
     */
    addAttribute(type, attribute) {
        this._attributes[type] = attribute;
    }

    /**
     * Add a texture UV attribute metadata
     * @param {number} location GPUs have limited number of texture buffers. Specify which buffer this texture metadata refers to.
     * @param {MeshPrimitiveAttribute} texCoordAttrib The mesh primitive attribute metadata for the texture
     */
    addTexCoordAttribute(location, texCoordAttrib) {
        this._texCoords[location] = texCoordAttrib;
    }

    /**
     * @typedef {Object} ProgramInfo
     * @property {Object.<string, object>[]} attributes
     * @property {Object.<string, object>[]} uniforms
     */

    /**
     * Tells WebGL to allocate VRAM for vertex attribute data.
     * This is because primitives may have some or all attributes. Some primitives may use different shaders that don't utilize some attributes.
     * @param {WebGL2RenderingContext} gl 
     * @param {ProgramInfo} programInfo Contains pointers for the shader "attributes". These are shader variables into which the GPU loads vertex data.
     */
    initialize(gl, programInfo) {
        // TODO(Adam: Research if this would be best enabled/disabled on render with having each primitive share a shader instance.
        if (this._attributes.POSITION) {    
            gl.enableVertexAttribArray(programInfo.attributes.aVertexPosition);
        }
        if (this._attributes.NORMAL) {
            gl.enableVertexAttribArray(programInfo.attributes.aVertexNormal);
        }
        if (Object.keys(this._texCoords).length) {
            for (let loc in this._texCoords) {
                gl.enableVertexAttribArray(programInfo.attributes[`aTextureCoord${loc}`]);
            }
        }
        if (this._attributes.TANGENT) {
            gl.enableVertexAttribArray(programInfo.attributes.aTangent);
        }
        this._init = true;
    }

    /**
     * The ultimate render call. Render the primitive triangle. 
     * 1. For each vertex attribute, copy the attribute buffer data into a WebGL buffer to be shipped to the GPU. Describe to WebGL how to read the data.
     * 2. Copy the model's transform matrix into the shader. The vertex shader will multiply model matrix with the projection matrix to convert vertices to 2D screen coordinates.
     * 3. Send the draw commmand to the GPU
     * @param {WebGL2RenderingContext} gl 
     * @param {ProgramInfo} programInfo Contains pointers for the shader "attributes". These are shader variables into which the GPU loads vertex data.
     * @param {Uint8Array[]} bufferViews BufferViews contain vector data in bytes intended to be shipped to the GPU for rendering. There should be one buffer view per attribute.
     * @param {mat4} modelMatrix The matrix containing orientation and location of vectors including: position, rotation, and scale.
     */
    render(gl, programInfo, bufferViews, modelMatrix) {
        if (this._init) {
            if (this._attributes.POSITION) {
                gl.bindBuffer(this._attributes.POSITION.target, bufferViews[this._attributes.POSITION.bufferViewIdx]);
                gl.vertexAttribPointer(
                    programInfo.attributes.aVertexPosition,
                    this._attributes.POSITION.components,
                    this._attributes.POSITION.type,
                    false,
                    this._attributes.POSITION.stride,
                    this._attributes.POSITION.offset,
                );
            }
            if (this._attributes.NORMAL) {
                gl.bindBuffer(this._attributes.NORMAL.target, bufferViews[this._attributes.NORMAL.bufferViewIdx]);
                gl.vertexAttribPointer(
                    programInfo.attributes.aVertexNormal,
                    this._attributes.NORMAL.components,
                    this._attributes.NORMAL.type,
                    false,
                    this._attributes.NORMAL.stride,
                    this._attributes.NORMAL.offset,
                    );
                }
            if (this._attributes.COLOR_0) {
                gl.enableVertexAttribArray(programInfo.attributes.aBaseColor);
                gl.bindBuffer(this._attributes.COLOR_0.target, bufferViews[this._attributes.COLOR_0.bufferViewIdx]);
                gl.vertexAttribPointer(
                    programInfo.attributes.aBaseColor,
                    this._attributes.COLOR_0.components,
                    this._attributes.COLOR_0.type,
                    false,
                    this._attributes.COLOR_0.stride,
                    this._attributes.COLOR_0.offset,
                );
            }
            if (Object.keys(this._texCoords).length) {
                for (let loc in this._texCoords) {
                    let texCoordAttrib = this._texCoords[loc];
                    gl.bindBuffer(texCoordAttrib.target, bufferViews[texCoordAttrib.bufferViewIdx]);
                    gl.vertexAttribPointer(
                        programInfo.attributes[`aTextureCoord${loc}`],
                        texCoordAttrib.components,
                        texCoordAttrib.type,
                        false,
                        texCoordAttrib.stride,
                        texCoordAttrib.offset,
                    );
                }
            }
            if (this._attributes.TANGENT) { 
                gl.bindBuffer(this._attributes.TANGENT.target, bufferViews[this._attributes.TANGENT.bufferViewIdx]);
                gl.vertexAttribPointer(
                    programInfo.attributes.aTangent,
                    this._attributes.TANGENT.components,
                    this._attributes.TANGENT.type,
                    false,
                    this._attributes.TANGENT.stride,
                    this._attributes.TANGENT.offset,
                );
            }
            {
                gl.bindBuffer(this._indices.target, bufferViews[this._indices.bufferViewIdx]);
                    
                gl.uniformMatrix4fv(
                    programInfo.uniforms.uModelMatrix,
                    false,
                    modelMatrix,
                );
                {
                    gl.drawElements(
                        this._mode,
                        this._indices.count,
                        this._indices.type,
                        this._indices.offset,
                    );
                }
            }
        }
    }
}
            

/**
 * @classdesc
 * The mesh for a single model. This contains all of the materials and primitive triangles which when assembled create a 3D object.
 * 
 * @class
 */
class Mesh {
    /**
     * @constructor
     */
    constructor() {
        this._primitives = [];
        // NOTE(Adam): An array of pointers to material used by each primitive. This should be the same length as the primitives array. The surface of a model may be composed
        //   from different materials.
        this._materials = [];
        this._init = false;
    }

    /**
     * Adds a primitive and a pointer to its corresponding material
     * @param {MeshPrimitive} primitive mesh primitive
     * @param {Material} material primitive's material
     */
    addPrimitive(primitive, material) {
        this._primitives.push(primitive);
        this._materials.push(material);
    }

    /**
     * Initialize the shader program for all primitives? NOTE(Adam): huh?? research why this isn't done per render per primitive.
     * @param {WebGL2RenderingContext} gl 
     */
    initialize(gl) {
        for (let i = 0; i < this._primitives.length; i++) {
            this._primitives[i].initialize(gl, this._materials[i]._shader._programInfo);
        }
        this._init = true;
    }

    /**
     * Loop through all primitive and render each primitive.
     * For each primitive, ship the material, light, and camera data into the shader program
     * TODO(Adam): Research if I need to pass light and camera data into the shader for each primitive. Shouldn't these be global constants for the frame? UPDATE: This is 
     *   currently because each primitive is given it's own shader instance. 
     * @param {WebGL2RenderingContext} gl 
     * @param {Uint8Array[]} bufferViews An array of vertex buffers
     * @param {mat4} modelMatrix The matrix containing orientation and location of vectors including: position, rotation, and scale.
     */
    render(gl, bufferViews, modelMatrix) {
        if (this._init) {
            for (let i = 0; i < this._primitives.length; i += 1) {
                let material = this._materials[i];
                if (material) { // NOTE(Adam): Why do I need this if statement?
                    let programInfo = this._materials[i].render(gl);
                    if (programInfo) {
                        GameState.lights.forEach(light => {
                            light.render(gl, programInfo);
                        });
                        GameState.camera.render(gl, programInfo);
                        this._primitives[i].render(
                            gl,
                            programInfo,
                            bufferViews,
                            modelMatrix,
                        );
                    }
                }
            }
        }
    }
}
