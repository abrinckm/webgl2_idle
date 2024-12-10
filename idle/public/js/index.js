async function main() {
    const canvas = GameState.canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Enable Extensions for CubeMap rendering
    const use8bit = false;
    const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
    if (!gl.getExtension('EXT_color_buffer_float')) {
        use8bit = true;
    }
    gl.getExtension('OES_texture_float_linear');
    Shader.use8bit = use8bit;
    if (anisotropic) {
        Shader.anisotropySupported = true;
        Shader.anisotropy = anisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
        Shader.maxAnisotropy = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }

    GameState.gl = gl;

    // Load shaders
    await PBRShader.loadShaders();
    // await MirrorShader.loadShaders();
    await CubeMapShader.loadShaders();
    // await PanoramaToCubeShader.loadShaders();
    
    // NOTE(Adam): Generate cube map from equirectangular image using the EnvShader
    // let cubeMapTexture = null;
    // let irradianceMapId = null; 
    // {
    //     // TODO(Adam): Check client capabilities
    //     const panoramaToCubeShader = new PanoramaToCubeShader();
    //     const envMap = new EnvironmentMap();
    //     await envMap.load(gl, "Assets/skybox/Mono_Lake_B_Ref.hdr");
    //     let cubeMapResolution = 256;
    //     cubeMapTexture = envMap.generateCubeMap(gl, panoramaToCubeShader, cubeMapResolution, false);
    // }

    // Initialize SkyBox
    const skyboxShader = new CubeMapShader();
    const skybox = new CubeMap(skyboxShader);
    skybox.load(gl, [
        'Assets/skybox/right.jpg',
        'Assets/skybox/left.jpg',
        'Assets/skybox/top.jpg',
        'Assets/skybox/bottom.jpg',
        'Assets/skybox/front.jpg',
        'Assets/skybox/back.jpg',
    ])
    window.setTimeout(() => {skybox.initialize(gl);}, 3000);  // NOTE(Adam): Waiting for assets to load??
    // skybox.initialize(gl);
    GameState.skybox = skybox;

    const light = new Light();
    light.type = Light.Point;
    light.color = vec3.fromValues(10.0, 10.0, 10.0);
    light.position = vec3.fromValues(1.0, -3.5, 0.7);
    GameState.lights.push(light);
    for (let i = 0; i < GameState.lights.length; i++) {
        GameState.lights[i].initialize(i);
    }

    // gl.clearColor(0.8705, 0.8705, 0.9372, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    
    const scene = new Node();

    // Add objects into the scene and position them
    {
        let loader = new GltfLoaderIdle();
        // let uri = 'Assets/Models/PBR/lieutenantHead/lieutenantHead.gltf';
        let uri = 'Assets/Models/PBR/Adam/adamHead.gltf';
        adamHead = await loader.loadAsset(gl, uri);
        // adamHead.rotate(90 * Math.PI / 180, vec3.fromValues(1.0, 0.0, 0.0));
        // adamHead.translate(vec3.fromValues(0.0, -3.5, 0.5));
        adamHead.translate(vec3.fromValues(0.0, 0.0, -3.5));
        // adamHead.scale(vec3.fromValues(100, 100, 100));
        adamHead.rotate(180*Math.PI/180, vec3.fromValues(0.0, 1.0, 0.0));
        // adamHead.rotate(180*Math.PI/180, vec3.fromValues(0.0, 0.0, 1.0));
        scene.addChild(adamHead, 'adamHead');
    }

    scene.initialize(gl);
    
    GameState.scene = scene;
    GameState.camera = new Camera(45, gl.canvas.width / gl.canvas.height, 0.01, 1000);
    GameState.controls = Controls.initialize(canvas);
    GameState.debug = document.querySelector("#debug");
    GameState.startScene();
}

main();
