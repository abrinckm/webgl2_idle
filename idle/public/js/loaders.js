//https://github.com/bwasty/gltf-loader-ts;

const COMPONENT_SIZES = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4
}


/**
 * @classdesc
 * An extension of bwasty's gltf loader. This in a URI to a GLTF file, loads the data, then instantiates scene assets, materials, and textures.
 * 
 * @class
 * @extends GltfLoader.GltfLoader
 */
class GltfLoaderIdle extends GltfLoader.GltfLoader {

    /**
     * Loads the GLTF data from the file, then instantiates all of the asset's materials and textures from the data.
     * @async
     * @param {WebGL2RenderingContext} gl 
     * @param {string} uri URI location of the gltf file
     * @returns {Asset} The complete scene asset with materials, textures, and buffer views
     */
    async loadAsset(gl, uri) {
        let asset = await this.load(uri);
        let gltf = asset.gltf;
        let sceneAsset = new Asset();

        {
            let bufferViewData = await this._loadBufferViews(asset, gltf);
            let textures = this._loadTextures(gl, gltf);
            let materials = this._loadMaterials(gltf, textures);
            sceneAsset.bufferViewData(bufferViewData);
            sceneAsset.textures(textures);
            sceneAsset.materials(materials);
        }
        
        let defaultScene = gltf.scenes[gltf.scene];
        let nodes = defaultScene.nodes;
        this._provisionChildNodes(gl, gltf, sceneAsset, sceneAsset, nodes);

        return sceneAsset;
    }

    /**
     * Loads the vertex buffer views. TODO(Adam): load joints & weights buffer views. 
     * NOTE(Adam): why is this async?
     * @async
     * @param {Asset} asset 
     * @param {GltfLoader.GltfAsset} gltf GLTF Asset
     * @returns {Uint8Array[]} List of buffer views. Buffer views are an array of bytes containing vertex data
     */
    async _loadBufferViews(asset, gltf) {
        asset.test = async function(index) {
            if (!this.gltf.bufferViews) {
                /* istanbul ignore next */
                throw new Error('No buffer views found.');
            }
            const bufferView = this.gltf.bufferViews[index];
            const bufferData = await this.bufferData.get(bufferView.buffer);
            const byteLength = bufferView.byteLength || 0;
            const byteOffset = bufferView.byteOffset || 0;
    
            // For GLB files, the 'base buffer' is the whole GLB file, including the json part.
            // Therefore we have to consider bufferData's offset within its buffer it as well.
            // For non-GLB files it will be 0.
            const baseBuffer = bufferData.buffer;
            const baseBufferByteOffset = bufferData.byteOffset;
            return new Uint8Array(baseBuffer, baseBufferByteOffset + byteOffset, byteLength);
        }
        const views = [];
        for (let i = 0; i < gltf.bufferViews.length; i += 1) {
            let { target } = gltf.bufferViews[i];
            if (target) { // TODO(Adam): Implement joints & weights buffer views
                // let data = await asset.bufferViewData(i);
                let data = await asset.test(i);
                views.push({data, target});
            }
        }
        return views;
    }

    /**
     * Instantiates new textures and loads the image data.
     * @param {WebGL2RenderingContext} gl used to instantiate WebGL datastructures to load texture data into.
     * @param {GltfLoader.GltfAsset} gltf GLTF Asset
     * @returns {Texture[]} The array of pre-loaded textures
     */
    _loadTextures(gl, gltf) {
        const textures = [];
        for (let i = 0; i < gltf.textures.length; i += 1) {
            let sampler = gltf.samplers[gltf.textures[i].sampler];
            let { magFilter, minFilter, wrapS, wrapT } = sampler;
            let texture = new Texture(magFilter, minFilter, wrapS, wrapT);
            texture.load(gl, gltf.images[gltf.textures[i].source].uri);
            textures.push(texture);
        }
        return textures;
    }

    /**
     * Instantiate a new Material with a new Shader and load any textures used by the material.
     * @param {GltfLoader.GltfAsset} gltf GLTF Asset
     * @param {Textures[]} textures An array of textures used by the materials
     * @returns {Materials[]} An array of materials
     */
    _loadMaterials(gltf, textures) {
        const materials = [];
        for (let i = 0; i < gltf.materials.length; i += 1) {
            let mat = gltf.materials[i];
            let material = new Material(new PBRShader());  // NOTE(Adam): why? why have a separate instance of the same shader per material?
            
            if (mat.normalTexture) {
                let { index, scale } = mat.normalTexture;
                material.addNormalMap(textures[index]);
                if (scale) {
                    material.uNormalScale(scale);
                }
            }
            material.uEmissiveFactor(mat.emissiveFactor);
            if (mat.emissiveTexture) {
                material.addEmissiveMap(textures[mat.emissiveTexture.index]);
            }
            if (mat.occlusionTexture) {
                let { index, strength } = mat.occlusionTexture;
                material.addOcclusionMap(textures[index]);
                if (strength) {
                    material.uOcclusionStrength(strength);
                }
            }
            
            let reqs = gltf.extensionsRequired;
            for (let j = 0; j < reqs.length; j++) {
                this[reqs[j]](material, mat.extensions, textures);
            }
            materials.push(material);
        }
        return materials;
    }

    /**
     * The coded shaders and the materials support the PBR specular glossiness extension. Checks if the GLTF asset has these extensions, and 
     * if so, load these extension values into the material.
     * @param {Material} material The material to load the PBR specular glossiness values into
     * @param {Object} extensions GLTF extensions
     * @param {Textures[]} textures An array with the SpecularGlossiness texture and/or diffuse texture
     */
    KHR_materials_pbrSpecularGlossiness(material, extensions, textures) {
        let { diffuseFactor, specularFactor, glossinessFactor } = extensions.KHR_materials_pbrSpecularGlossiness;
        if (diffuseFactor) {
            material.uDiffuseFactor(diffuseFactor);
        }
        if (specularFactor) {
            material.uSpecularFactor(specularFactor);
        }
        if (glossinessFactor) {
            material.uGlossinessFactor(glossinessFactor);
        }
        let { diffuseTexture, specularGlossinessTexture} = extensions.KHR_materials_pbrSpecularGlossiness;
        if (diffuseTexture) {
            material.addDiffuseMap(textures[diffuseTexture.index]);
        }
        if (specularGlossinessTexture) {
            material.addSpecularGlossinessMap(textures[specularGlossinessTexture.index]);
        }
    }

    /**
     * Recursively create the hierarchical scene graph.
     * @param {WebGL2RenderingContext} gl 
     * @param {GltfLoader.GltfAsset} gltf GLTF Asset
     * @param {Asset} sceneAsset Root scene node
     * @param {Asset} parent Local parent scene node
     * @param {GltfLoader.Node[]} children An array of GLTF children node data
     */
    _provisionChildNodes(gl, gltf, sceneAsset, parent, children) {
        for (let i = 0; i < children.length; i += 1) {
            let node = gltf.nodes[children[i]];
            let childNode;
            // The childNode will either be a renderable Model (with mesh) or an empty transform
            if (node.mesh != undefined) {
                childNode = this._loadMesh(gltf, node.mesh, sceneAsset);
                sceneAsset.addModel(children[i], childNode);
            }
            else {
                childNode = new Transform();
            }
            // If the the child node already has an orientation configured by the 3D model, then apply this orientation
            if (node.matrix) {
                childNode.modelMatrix(node.matrix);
            }
            // Otherwise, it does not have an orientation set the 3D model. So use a default orientation
            else {
                let translation = node.translation || vec3.create();
                let rotation = node.rotation || quat.create();
                let scale = node.scale || vec3.fromValues(1.0, 1.0, 1.0);
                childNode.transform(rotation, translation, scale);
            }
            parent.addChild(childNode, node.name);
            if (node.children) {
                this._provisionChildNodes(gl, gltf, sceneAsset, childNode, node.children);
            }
        }
    }

    /**
     * Instantiates a new Model with a renderable mesh. Instantiates all of the mesh primitives and their attributes.
     * @param {GLTFLoader.GltfAsset} gltf The GLTF asset
     * @param {GLTFLoader.Mesh} nodeMesh 
     * @param {Asset} sceneAsset Root scene node
     * @returns {Model} Model with mesh
     */
    _loadMesh(gltf, nodeMesh, sceneAsset) {
        let model = new Model();
        let mesh = new Mesh();
        let primitives = gltf.meshes[nodeMesh].primitives;
        for (let j = 0; j < primitives.length; j += 1) {
            let primitive = primitives[j];
            let mode = primitive.mode;
            let indices = this._loadAttribute(gltf, primitive.indices);
            const meshPrim = new MeshPrimitive(mode, indices);
            for (let attribType in primitive.attributes) {
                const attrib = this._loadAttribute(gltf, primitive.attributes[attribType]);
                // The texture coord attribute for the mesh primitive is added as a special tex attribute because GPUs only have a specific number
                // of memory locations we can load texture data into.
                if (attribType.match("TEX")) {
                    meshPrim.addTexCoordAttribute(attribType.split("_")[1], attrib);
                } 
                // This is a generic vertex attribute. One of: POSITION, NORMAL, TANGENT, COLOR
                else {
                    meshPrim.addAttribute(attribType, attrib);
                } 
            }
            // Look up which material this primitive will use and then attach it to the primitive.
            const material = sceneAsset._materials[primitive.material];
            // If the primitive uses a solid COLOR attribute (sometimes in place of a diffuse texture), then define a boolean on the shader
            // to let the shader logic know that this primitive will require coloring based on the vertex attribute data.
            // NOTE(Adam): Is this the reason each mesh primitive has it's own shader instantiation? Can we just undefine/define during rending per primitive? or just set a
            //   a uniform variable?
            if (primitive.attributes.COLOR_0) {
                material._shader.define("HAS_BASE_COLOR");
            }
            mesh.addPrimitive(meshPrim,  material);
        }
        model.setMesh(mesh);
        return model;
    }

    /**
     * Instantiates a new MeshPrimitiveAttribute using GTLF buffer view metadata referenced by the given attribute ID.
     * @param {GLTFLoader.GltfAsset} gltf The GLTF asset
     * @param {GLTFLoader.GltfId} attribute The index of the attribute to load from the GTLF buffer asset accessors
     * @returns 
     */
    _loadAttribute(gltf, attribute) {
        let accessor = gltf.accessors[attribute];
        let bufferViewIdx = accessor.bufferView;
        let bufferView = gltf.bufferViews[bufferViewIdx];
        return new MeshPrimitiveAttribute(
            bufferViewIdx,
            bufferView.target,
            COMPONENT_SIZES[accessor.type],
            accessor.componentType,
            bufferView.byteStride || 0,
            accessor.byteOffset,
            accessor.count,
        );
    }
}


/**
 * @classdesc
 * Loads an asset to be used by the mirror shader. Similar to the AssetLoader above in almost every regard except for loading the mesh attributes.
 * 
 * @class
 * @extends GltfLoader.GltfLoader
 */
class MirrorLoader extends GltfLoader.GltfLoader {
    async loadAsset(gl, uri) {
        let asset = await this.load(uri);
        let gltf = asset.gltf;
        let sceneAsset = new Asset();

        {
            let bufferViewData = await this._loadBufferViews(asset, gltf);
            let material = new Material(new MirrorShader());
            sceneAsset.bufferViewData(bufferViewData);
            sceneAsset.materials([material]);
        }

        let defaultScene = gltf.scenes[gltf.scene];
        let nodes = defaultScene.nodes;
        this._provisionChildNodes(gl, gltf, sceneAsset, sceneAsset, nodes);

        return sceneAsset;
    }

    async _loadBufferViews(asset, gltf) {
        const views = [];
        for (let i = 0; i < gltf.bufferViews.length; i += 1) {
            let { target } = gltf.bufferViews[i];
            if (target) { // TODO(Adam): Implement joints & weights buffer views
                let data = await asset.bufferViewData(i);
                views.push({data, target});
            }
        }
        return views;
    }

    _provisionChildNodes(gl, gltf, sceneAsset, parent, children) {
        for (let i = 0; i < children.length; i += 1) {
            let node = gltf.nodes[children[i]];
            let childNode;
            if (node.mesh != undefined) {
                childNode = this._loadMesh(gltf, node.mesh, sceneAsset);
                sceneAsset.addModel(children[i], childNode);
            }
            else {
                childNode = new Transform();
            }
            if (node.matrix) {
                childNode.modelMatrix(node.matrix);
            }
            else {
                let translation = node.translation || vec3.create();
                let rotation = node.rotation || quat.create();
                let scale = node.scale || vec3.fromValues(1.0, 1.0, 1.0);
                childNode.transform(rotation, translation, scale);
            }
            parent.addChild(childNode, node.name);
            if (node.children) {
                this._provisionChildNodes(gl, gltf, sceneAsset, childNode, node.children);
            }
        }
    }

    _loadMesh(gltf, nodeMesh, sceneAsset) {
        let model = new Model();
        let mesh = new Mesh();
        let primitives = gltf.meshes[nodeMesh].primitives;
        for (let j = 0; j < primitives.length; j += 1) {
            let primitive = primitives[j];
            let mode = primitive.mode;
            let indices = this._loadAttribute(gltf, primitive.indices);
            const meshPrim = new MeshPrimitive(mode, indices);
            let position = this._loadAttribute(gltf, primitive.attributes.POSITION);
            meshPrim.addAttribute("POSITION", position);
            let normal = this._loadAttribute(gltf, primitive.attributes.NORMAL);
            meshPrim.addAttribute("NORMAL", normal);
            mesh.addPrimitive(meshPrim, sceneAsset._materials[0]);
        }
        model.setMesh(mesh);
        return model;
    }

    _loadAttribute(gltf, attribute) {
        let accessor = gltf.accessors[attribute];
        let bufferViewIdx = accessor.bufferView;
        let bufferView = gltf.bufferViews[bufferViewIdx];
        return new MeshPrimitiveAttribute(
            bufferViewIdx,
            bufferView.target,
            COMPONENT_SIZES[accessor.type],
            accessor.componentType,
            bufferView.byteStride || 0,
            accessor.byteOffset,
            accessor.count,
        );
    }
}


/**
 * (WIP)
 * hdrpng.js - https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Viewer/master/source/libs/hdrpng.js
 */
class HDRLoader {
    static _rgbeToFloat(buffer)
    {
        const length = buffer.byteLength >> 2;
        const result = new Float32Array(length * 3);
    
        for (let i = 0; i < length; i++)
        {
            const s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
    
            result[i * 3] = buffer[i * 4] * s;
            result[i * 3 + 1] = buffer[i * 4 + 1] * s;
            result[i * 3 + 2] = buffer[i * 4 + 2] * s;
        }
        return result;
    }
    
    static loadHDR(buffer)
    {
        let header = '';
        let pos = 0;
        const d8 = buffer;
        let format = undefined;
        // read header.
        while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
        // check format.
        format = header.match(/FORMAT=(.*)$/m);
        if (format.length < 2)
        {
            return undefined;
        }
        format = format[1];
        if (format != '32-bit_rle_rgbe') return console.warn('unknown format : ' + format), this.onerror();
        // parse resolution
        let rez = header.split(/\n/).reverse();
        if (rez.length < 2)
        {
            return undefined;
        }
        rez = rez[1].split(' ');
        if (rez.length < 4)
        {
            return undefined;
        }
        const width = rez[3] * 1, height = rez[1] * 1;
        // Create image.
        const img = new Uint8Array(width * height * 4);
        let ipos = 0;
        // Read all scanlines
        for (let j = 0; j < height; j++)
        {
            const scanline = [];
    
            let rgbe = d8.slice(pos, pos += 4);
            const isNewRLE = (rgbe[0] == 2 && rgbe[1] == 2 && rgbe[2] == ((width >> 8) & 0xFF) && rgbe[3] == (width & 0xFF));
    
            if (isNewRLE && (width >= 8) && (width < 32768))
            {
                for (let i = 0; i < 4; i++)
                {
                    let ptr = i * width;
                    const ptr_end = (i + 1) * width;
                    let buf = undefined;
                    let count = undefined;
                    while (ptr < ptr_end)
                    {
                        buf = d8.slice(pos, pos += 2);
                        if (buf[0] > 128)
                        {
                            count = buf[0] - 128;
                            while (count-- > 0) scanline[ptr++] = buf[1];
                        }
                        else
                        {
                            count = buf[0] - 1;
                            scanline[ptr++] = buf[1];
                            while (count-- > 0) scanline[ptr++] = d8[pos++];
                        }
                    }
                }
    
                for (let i = 0; i < width; i++)
                {
                    img[ipos++] = scanline[i + 0 * width];
                    img[ipos++] = scanline[i + 1 * width];
                    img[ipos++] = scanline[i + 2 * width];
                    img[ipos++] = scanline[i + 3 * width];
                }
            }
            else
            {
                pos -= 4;
    
                for (let i = 0; i < width; i++)
                {
                    rgbe = d8.slice(pos, pos += 4);
    
                    img[ipos++] = rgbe[0];
                    img[ipos++] = rgbe[1];
                    img[ipos++] = rgbe[2];
                    img[ipos++] = rgbe[3];
                }
            }
        }
    
        const imageFloatBuffer = HDRLoader._rgbeToFloat(img);
    
        return {
            dataFloat: imageFloatBuffer,
            width: width,
            height: height
        };
    }
}
