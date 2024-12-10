/**
* @classdesc
* A scene is essentially a hierarchical graph of nodes starting with one root node.
* Every node is positioned or rotated relative to it's parent node. Every parent node and all of it's descendants can be thought of as a local system, local to its parent.
* In every local system, any transformations applied to a child node are always done in relation to the parent (or root of the local system).
* Inversely, any transformation done on the parent node would be applied to all descendants of the parent node.
* This inverse relationship (AKA inverse kinematics or in short IK) allows for complex scene animations.
* The root node for the scene has no parent, so its transformations are not relative to any node, but are rather relative to the viewer.
*
* @class
*/
class Node {

    /**
    * @constructor
    */
    constructor() {
        this._init = false;
        this._children = {}
        this._hasChildren = false;
        this._parent = null;
        this._worldMatrix = mat4.create();  // NOTE(Adam): I don't like this here..
    }

    /**
    * Makes a node a child of this node
    * @param {Node} node The node to add
    * @param {string} name The name of the node which can be used to find the child node
    */
    addChild(node, name) {
        this._children[name] = node;
        node._setParent(this);
        this._hasChildren = true;
    }

    /**
    * Don't call this directly. This should only be called by `Node.addChild()`. Sets the parent node of this node.
    * @private
    * @param {Node} parent The parent node
    */
    _setParent(parent) {
        this._parent = parent;
    }

    /**
    * Retrieves a child node by name
    * @param {string} name The name of the child node
    * @returns {Node} The child node
    */
    getChildByName(name) {
        try {
            return this._children[name];
        } catch (e) {
            console.error(`Child ${name} could not be found in scene`);
        }
    }

    /**
    * Perform any initialization required on the scene hierarchy. Initialization is implemented by the child class.
    * @param {WebGLRenderingContext} (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
    */
    initialize(gl) {
        if (this._hasChildren) {
            for (let child in this._children) {
                this._children[child].initialize(gl);
            }
        }
    }

    /**
    * Perform any updates required on the scene hierarchy. Updates are implemented by the child class.
    * @param {number} deltaTime The number of milliseconds elapsed since the last update.
    */
    update(deltaTime) {
        if (this._hasChildren) {
            for (let child in this._children) {
                this._children[child].update(deltaTime);
            }
        }
    }

    /**
    * Render the entire scene hierarchy. Rendering implementations defined by the child classes.
    * @param {WebGLRenderingContext} (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
    */
    render(gl) {
        for (let k in this._children) {
            this._children[k].render(gl);
        }
    }
}


/**
* @classdesc
* The Transform stores information about the location and orientation of a vectors in euclidean space. This information is used
* to convert a vector from 3D world space coordinates to a 2D screen space coordinates relative to the viewer or camera.
* The three attributes of a transform are: translation, rotation, and scale. Each attribute is stored as a 3D vector within a 4x4 matrix.
* - Rotation radians about the x, y, and z axis.
* - Translation position delta from the origin (0, 0, 0)
* - Scale the magnitude of size along each axis.
* 
* @class
* @extends Node
*/
class Transform extends Node {
    
    /**
    * @constructor
    */
    constructor() {
        super();
        // The model matrix stores the orientation of the model relative to the origin
        this._modelMatrix = mat4.create();
        // The world matrix stores the orientation relative to it's parent
        // Finding the orientation in world space is done by multiplying model transform with parent transform.
        this._worldMatrix = mat4.create();
    }

    /**
    * Sets the position and orientation of the transform
    * @param {vec3} rotation The angle of rotation about each axis in radians
    * @param {vec3} translation The position delta from the origin (0, 0, 0)
    * @param {vec3} scale The size in magnitude about each axis
    */
    transform(rotation, translation, scale) {
        mat4.fromRotationTranslationScale(
            this._modelMatrix,
            rotation,
            translation,
            scale,
        );
    }

    /**
     * This is a getter/setter for the world matrix. Returns the current world matrix. Or recalculates and returns the new world matrix.
     * @param {boolean} [doUpdate] Should the world matrix be recalculated or not. It should only be recalculated after an update.
     * @returns {mat4} 4x4 world matrix
     */
    worldMatrix(doUpdate=false) {
        if (doUpdate && this._parent) {
            mat4.mul(
                this._worldMatrix,
                this._parent._worldMatrix,
                this._modelMatrix,
            );
        }
        return this._worldMatrix;
    }

    /**
     * This is a getter/setter for the model model matrix.
     * @param {mat4} [matrix] The new model matrix
     * @returns {mat4} The model matrix
     */
    modelMatrix(matrix=null) {
        if (matrix) {
            this._modelMatrix = mat4.clone(matrix);
        }
        return matrix;
    }

    /**
     * Translate the model. Move the model a number of units from it's current position.
     * @param {vec3} vec3Translation The amount to move along each axis (x, y, z).
     */
    translate(vec3Translation) {
        mat4.translate(
            this._modelMatrix,
            this._modelMatrix,
            vec3Translation
        );
    }

    /**
     * Rotate the model. The anchor point for the axis of rotation is the origin (0, 0, 0). In other words, the anchor point of the model itself.
     * @param {number} radians The angle in radians to rotate
     * @param {vec3} vec3Axis The axis about which to rotate
     */
    rotate(radians, vec3Axis) {
        mat4.rotate(
            this._modelMatrix,
            this._modelMatrix,
            radians,
            vec3Axis
        );
    }

    /**
     * Scale the model. The anchor point is the origin, which is the anchor for the model itself.
     * @param {vec3} vec3Scaling The magnitute to scale along each each axis.
     */
    scale(vec3Scaling) {
        mat4.scale(
            this._modelMatrix,
            this._modelMatrix,
            vec3Scaling
        );
    }

    /**
     * Update the world matrix.
     * @param {number} deltaTime The number of milliseconds elapsed since last update.
     */
    update(deltaTime) {
        this.worldMatrix(true);
        super.update(deltaTime);
    }
}


/**
 * @classdesc
 * A model is a scene node that contains a transform and a mesh. This class is mostly used to instantiate simple 3D shapes and objects.
 * 
 * @class
 * @extends Transform
 */
class Model extends Transform {

    /**
     * @constructor
     */
    constructor() {
        super();
        this._mesh;
        this._animation = null;
    }
    
    /**
     * Sets the mesh for the model.
     * @param {Mesh} mesh A list of primitives and materials that constitutes the shape and look of the model
     */
    setMesh(mesh) {
        this._mesh = mesh;
    }

    /**
     * Sets the animation script for the model.
     * @param {Animation} animation The animation script of keyframes and timings that constitute an animation.
     */
    setAnimation(animation) {
        this._animation = animation;
    }

    /**
     * Initialize the model. Passes the gl context down into the mesh so that the mesh can define gl shader parameters
     * @param {WebGL2RenderingContext} gl 
     */
    initialize(gl) {
        this._mesh.initialize(gl);
        super.initialize(gl);
        this._init = true;
    }

    /**
     * Apply an animation keyframe to transform the model matrix.
     * @param {number} deltaTime The number milliseconds elapsed since last update
     */
    update(deltaTime) {
        if (this._animation) {
            this._animation.update(deltaTime, this._modelMatrix);
        }
        super.update(deltaTime);
    }

    /**
     * Render the model
     * @param {WebGL2RenderingContext} gl (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     * @param {Uint8Array[]} bufferViews BufferViews contain vector data in bytes intended to be shipped to the GPU for rendering
     */
    render(gl, bufferViews) {
        if (this._init) {
            this._mesh.render(gl, bufferViews, this._worldMatrix);
        }
    }
}


/**
 * @classdesc
 * An asset is a hierarchical assembly of models, textures, materials, lights, and other data that make up a complex game object in the scene.
 * Most game objects will be instantiated as an Asset. The only exception to this rule would be if the object happened to be singular (i.e. has no node hierarchy), 
 * does not incorporate IK animations, and does not utilize advanced rendering techniques requiring additional vector data. Such simple shapes (e.g., cube, sphere) 
 * would instead be instantiated as a Model.
 * 
 * @class
 * @extends Transform
 */
class Asset extends Transform {

    /**
     * @constructor
     */
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

    /**
     * @typedef {Object} BufferViewData
     * @property {number} buffer The index of the buffer
     * @property {number} byteLength The length of the buffer in bytes
     * @property {number} [target] Target GPU buffer
     * @property {number} [byteOffset] The offset into the buffer in bytes
     * @property {number} [byteStride] The stride, in bytes
     */

    /**
     * A setter function for BufferViewData.
     * @param {BufferViewData} bufferViewData Information that describes how to access the vector data
     */
    bufferViewData(bufferViewData) {
        this._bufferViewData = bufferViewData;
    }

    /**
     * A getter/setter function for textures. 
     * NOTE(Adam): Is this needed? Textures are assigned to the materials and are never referenced from the asset.
     * @param {Texture[]} [textures] A list of texture data
     * @returns {Texture[]}
     */
    textures(textures=null) {
        if (textures) {
            this._textures = textures;
        }
        return this._textures;
    }

    /**
     * A getter/setter function for materials.
     * @param {Material[]} [materials] A list of material data
     * @returns {Material[]}
     */
    materials(materials) {
        if (materials) {
            this._materials = materials;
        }
        return this._materials;
    }

    /**
     * Adds a new rendering model. Depending on the asset, there may be multiple child nodes in the asset that use the same model.
     * This function checks if the model was already added to so we don't cause model duplication and memory bloat.
     * @param {string|number} idx The GLTF index
     * @param {Model} model The new rendering model.
     */
    addModel(idx, model) {
        if (!this._models[idx]) {
            this._models[idx] = true;
            this._renderGroup.push(model);
        }
    }

    /**
     * Copy vector data from JS buffers into WebGLBuffers. JS Buffer data cannot be shipped to the GPU. 
     * WebGLBuffers are consumed by the WebGL API to ship vector data to the GPU.
     * Passes the gl context down to the materials for initialization.
     * @param {WebGL2RenderingContext} gl (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     */
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

    /**
     * Loop through render groups and render the model and it's children.
     * @param {WebGL2RenderingContext} gl (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
     */
    render(gl) {
        if (this._init) {
            for (let i = 0; i < this._renderGroup.length; i += 1) {
                let model = this._renderGroup[i];
                model.render(gl, this._bufferViews);
            }
        }
    }
}
