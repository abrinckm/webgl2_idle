class Node {
    constructor() {
        this._init = false;
        this._children = {}
        this._hasChildren = false;
        this._parent = null;
        this._worldMatrix = mat4.create(); // NOTE(Adam): I don't like this here.. 
    }

    addChild(node, name) {
        this._children[name] = node;
        node.setParent(this);
        this._hasChildren = true;
    }

    setParent(parent) {
        this._parent = parent;
    }

    getChildByName(name) {
        try {
            return this._children[name];
        } catch (e) {
            console.error(`Child ${name} could not be found in scene`);
        }
    }

    initialize(gl) {
        if (this._hasChildren) {
            for (let child in this._children) {
                this._children[child].initialize(gl);
            }
        }
    }

    update(deltaTime) {
        if (this._hasChildren) {
            for (let child in this._children) {
                this._children[child].update(deltaTime);
            }
        }
    }

    render(gl) {
        for (let k in this._children) {
            this._children[k].render(gl);
        }
    }
}


class Transform extends Node {
    constructor() {
        super();
        this._modelMatrix = mat4.create();
        this._worldMatrix = mat4.create();
    }

    transform(rotation, translation, scale) {
        mat4.fromRotationTranslationScale(
            this._modelMatrix,
            rotation,
            translation,
            scale,
        );
    }

    worldMatrix(forceCalculate) {
        if (forceCalculate && this._parent) {
            mat4.mul(
                this._worldMatrix,
                this._parent._worldMatrix,
                this._modelMatrix,
            );
        }
        return this._worldMatrix;
    }

    modelMatrix(matrix) {
        if (matrix) {
            this._modelMatrix = mat4.clone(matrix);
        }
        return matrix;
    }

    translate(vec3Translation) {
        mat4.translate(
            this._modelMatrix,
            this._modelMatrix,
            vec3Translation
        );
    }

    rotate(radians, vec3Axis) {
        mat4.rotate(
            this._modelMatrix,
            this._modelMatrix,
            radians,
            vec3Axis
        );
    }

    scale(vec3Scaling) {
        mat4.scale(
            this._modelMatrix,
            this._modelMatrix,
            vec3Scaling
        );
    }

    update(deltaTime) {
        this.worldMatrix(true);
        super.update(deltaTime);
    }
}


class Model extends Transform {
    constructor() {
        super();
        this._mesh;
        this._animation = null;
    }
    
    addMesh(mesh) {
        this._mesh = mesh;
    }

    addAnimation(animation) {
        this._animation = animation;
    }

    initialize(gl) {
        this._mesh.initialize(gl);
        super.initialize(gl);
        this._init = true;
    }

    update(deltaTime) {
        if (this._animation) {
            this._animation.update(deltaTime, this._modelMatrix);
        }
        super.update(deltaTime);
    }

    render(gl, bufferViews) {
        if (this._init) {
            this._mesh.render(gl, bufferViews, this._worldMatrix);
        }
    }
}


class Asset extends Transform {
    constructor() {
        super();
        this._bufferViewData = [];
        this._bufferViews = [];
        this._renderGroup = [];
        this._models = {};
        this._textures = [];
        this._materials = [];
        this._lights = [];
    }

    bufferViewData(bufferViewData) {
        this._bufferViewData = bufferViewData;
    }

    textures(textures) {
        if (textures) {
            this._textures= textures;
        }
        return this._textures;
    }

    materials(materials) {
        if (materials) {
            this._materials = materials;
        }
        return this._materials;
    }

    addModel(idx, model) {
        if (!this._models[idx]) {
            this._models[idx] = true;
            this._renderGroup.push(model);
        }
    }

    initialize(gl) {
        for (let i = 0; i < this._bufferViewData.length; i++) {
            let b = this._bufferViewData[i];
            let bufferView = gl.createBuffer();
            gl.bindBuffer(b.target, bufferView);
            gl.bufferData(b.target, b.data, gl.STATIC_DRAW);
            this._bufferViews.push(bufferView);
        }
        delete this._bufferViewData;
        for (let i = 0; i < this._materials.length; i++) {
            this._materials[i].initialize(gl, this._lights);
        }
        super.initialize(gl);
        this._init = true;
    }

    render(gl) {
        if (this._init) {
            for (let i = 0; i < this._renderGroup.length; i += 1) {
                let model = this._renderGroup[i];
                model.render(gl, this._bufferViews);
            }
        }
    }
}
