/**
 * @classdesc
 * Manages and maintains the states of the game. This includes controls, camera, scene graph, lights, and update and render loops.
 * 
 * @class
 */
class GameState {
    static camera = null;    //
    static controls = null;  //
    static canvas = null;    
    static debug = null;
    static scene = null;
    static skybox = null;
    static lights = [];
    static gl = null;

    /**
     * Checks if the game states have been properly initialized
     * @returns {boolean} Is all state variable set and initialized
     */
    static initialized = () => (
        GameState.camera &&
        GameState.controls &&
        GameState.canvas &&
        GameState.scene &&
        GameState.skybox &&
        GameState.lights.length &&
        GameState.gl
    )

    /**
     * Start the update loop for the class
     * @param {GameState} cls 
     * @returns {null}
     */
    static startScene(cls=GameState) {
        if (!cls.initialized) {
            return
        }
        let then = 0;
        let deltaTime = 0;

        const adamHead = cls.scene.getChildByName("adamHead");

        function update(now) {
            cls.gl.clear(cls.gl.COLOR_BUFFER_BIT | cls.gl.DEPTH_BUFFER_BIT);
    
            deltaTime = now - then;
            then = now;
            
            if (cls.controls.update(deltaTime, cls.camera)) {
                cls.camera.update();
            };
            adamHead.rotate(0.001, vec3.fromValues(0.0, -1.0, 0.0));
            cls.scene.update(deltaTime);
            cls.scene.render(cls.gl);
            cls.skybox.render(cls.gl);

            if (cls.debug) {
                cls.debug.innerHTML = `position: ${cls.camera._position} <br/> pitch: ${cls.camera._pitch} <br/> yaw: ${cls.camera._yaw}`;
            }
        
            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }
}
