

class MeshPrimitiveAttribute {
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


class MeshPrimitive {
    constructor(mode, indices) {
        this._mode = mode;
        this._indices = indices;
        this._attributes = {};
        this._texCoords = {};
        this._bound = false;
    }

    addAttribute(type, attribute) {
        this._attributes[type] = attribute;
    }

    addTexCoordAttribute(location, texCoordAttrib) {
        this._texCoords[location] = texCoordAttrib;
    }

    initialize(gl, programInfo) {
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
            

class Mesh {
    constructor() {
        this._primitives = [];
        this._materials = [];
        this._init = false;
    }

    addMaterial(material) {
        this._materials.push(material);
    }

    addPrimitive(primitive) {
        this._primitives.push(primitive);
    }

    initialize(gl) {
        for (let i = 0; i < this._primitives.length; i++) {
            this._primitives[i].initialize(gl, this._materials[i]._shader._programInfo);
        }
        this._init = true;
    }

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