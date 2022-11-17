//https://github.com/bwasty/gltf-loader-ts;

const COMPONENTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4
}


class GltfLoaderIdle extends GltfLoader.GltfLoader {

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

    _loadMaterials(gltf, textures) {
        const materials = [];
        for (let i = 0; i < gltf.materials.length; i += 1) {
            let mat = gltf.materials[i];
            let material = new Material(new PBRShader());
            
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
            for (let attribType in primitive.attributes) {
                const attrib = this._loadAttribute(gltf, primitive.attributes[attribType]);
                if (attribType.match("TEX")) {
                    meshPrim.addTexCoordAttribute(attribType.split("_")[1], attrib);
                } 
                else {
                    meshPrim.addAttribute(attribType, attrib);
                } 
            }
            mesh.addPrimitive(meshPrim);
            const material = sceneAsset._materials[primitive.material];
            if (primitive.attributes.COLOR_0) {
                material._shader.define("HAS_BASE_COLOR");
            }
            mesh.addMaterial(material);
        }
        model.addMesh(mesh);
        return model;
    }

    _loadAttribute(gltf, attribute) {
        let accessor = gltf.accessors[attribute];
        let bufferViewIdx = accessor.bufferView;
        let bufferView = gltf.bufferViews[bufferViewIdx];
        return new MeshPrimitiveAttribute(
            bufferViewIdx,
            bufferView.target,
            COMPONENTS[accessor.type],
            accessor.componentType,
            bufferView.byteStride || 0,
            accessor.byteOffset,
            accessor.count,
        );
    }
}


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
            mesh.addPrimitive(meshPrim);
            mesh.addMaterial(sceneAsset._materials[0]);
        }
        model.addMesh(mesh);
        return model;
    }

    _loadAttribute(gltf, attribute) {
        let accessor = gltf.accessors[attribute];
        let bufferViewIdx = accessor.bufferView;
        let bufferView = gltf.bufferViews[bufferViewIdx];
        return new MeshPrimitiveAttribute(
            bufferViewIdx,
            bufferView.target,
            COMPONENTS[accessor.type],
            accessor.componentType,
            bufferView.byteStride || 0,
            accessor.byteOffset,
            accessor.count,
        );
    }
}


/**
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
