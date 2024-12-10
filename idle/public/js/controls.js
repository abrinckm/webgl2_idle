const FORWARD = 0x001; // 'W'
const BACK = 0x008;    // 'S'
const LEFT = 0x040;    // 'A'
const RIGHT = 0x200;   // 'D'


/**
 * @classdesc
 * Captures user input and registers input as an action to adjust the camera during the update loop.
 * 
 * @class
 */
class Controls {

    static instance = null;

    /**
     * @typedef {Object} ControlOptions
     * @property {number} mouseSpeed
     * @property {number} moveSpeed
     * @property {number} sprintSpeed
     */

    /**
     * @constructor
     * @param {ControlOptions} options 
     */
    constructor(options=null) {
        options = options || {};
        this.mouseSpeed = options.mouseSpeed || 0.002;
        this.moveSpeed = options.moveSpeed || 0.005;
        this.sprintSpeed = options.sprintSpeed || 0.02;
        this.rotateActive = false;
        this.moveVector = 0x0;
        this.pitchDelta = 0.0;
        this.yawDelta = 0.0;
    }

    /**
     * Bind callback functions to the mouse and keyboard event listeners
     * @param {HTMLCanvasElement} canvas The HTML element
     * @param {ControlOptions} options 
     * @returns {Controls}
     */
    static initialize(canvas, options) {
        if (Controls.instance) {
            return Controls.instance;
        }
        const controls = new Controls(options);
        canvas.addEventListener("mousedown", () => { controls.rotateActive = true; });
        canvas.addEventListener("mouseup", () => { controls.rotateActive = false; });
        canvas.addEventListener("mousemove", controls.rotateCamera.bind(controls));
        window.addEventListener("keydown", controls.registerKeyDown.bind(controls));
        window.addEventListener("keyup", controls.registerKeyUp.bind(controls));
        Controls.instance = controls;
        return controls;
    }

    /**
     * Set the yaw and pitch deltas based on the mouse movements registered by the client browser
     * @param {MouseEvent} evt 
     */
    rotateCamera(evt) {
        if (this.rotateActive) {
            this.yawDelta = -evt.movementX;
            this.pitchDelta = -evt.movementY;
        }
    }

    /**
     * Set the move vector based on the keyboard event registered by the client browser
     * @param {KeyboardEvent} evt 
     */
    registerKeyDown(evt) {
        if (evt.code == "KeyW") {
            this.moveVector |= FORWARD;
        }
        if (evt.code == "KeyS") {
            this.moveVector |= BACK;
        }
        if (evt.code == "KeyA") {
            this.moveVector |= LEFT;
        }
        if (evt.code == "KeyD") {
            this.moveVector |= RIGHT;
        }
    }
    
    /**
     * Release a move vector based on the keyboard event registered by the client browser
     * @param {KeyboardEvent} evt 
     */
    registerKeyUp(evt) {
        if (evt.code == "KeyW") {
            this.moveVector ^= FORWARD;
        }
        if (evt.code == "KeyS") {
            this.moveVector ^= BACK;
        }
        if (evt.code == "KeyA") {
            this.moveVector ^= LEFT;
        }
        if (evt.code == "KeyD") {
            this.moveVector ^= RIGHT;
        }
    }

    /**
     * Convert rotation deltas to radians based on the milliseconds elapsed since last update. Convert camera movement speed based on milliseconds since last update.
     * Update the camera.
     * @param {number} deltaTime Milliseconds since last update
     * @param {Camera} camera 
     * @returns {boolean} True if a movement or rotation happened this update iteration.
     */
    update(deltaTime, camera) {
        if (this.rotateActive) {
            let gain = this.mouseSpeed * deltaTime;
            camera.rotate(
                this.yawDelta * gain,
                this.pitchDelta * gain,
            );
            this.yawDelta = this.pitchDelta = 0.0;
        }
        if(this.moveVector) {
            const velocity = vec3.create();
            let gain = this.moveSpeed * deltaTime;
            if (this.moveVector & FORWARD) {
                this._addVelocity(velocity, camera._forward, gain);
            }
            else if (this.moveVector & BACK) {
                this._addVelocity(velocity, camera._forward, -gain);
            }
            if (this.moveVector & LEFT) {
                this._addVelocity(velocity, camera._right, -gain);
            }
            else if (this.moveVector & RIGHT) {
                this._addVelocity(velocity, camera._right, gain);
            }
            camera.translate(velocity);
        }
        return this.moveVector | this.rotateActive;
    }

    /**
     * Helper function to adjust movement vectors based on movement speed and delta time
     * @param {vec3} velocity Out vector. the new movement velocity
     * @param {vec3} vector In vector. the current movement vector
     * @param {number} gain The amount to scale the velocity
     */
    _addVelocity(velocity, vector, gain) {
        vec3.add(
            velocity,
            velocity,
            vec3.scale(vec3.create(), vector, gain)
        );
    }
}
