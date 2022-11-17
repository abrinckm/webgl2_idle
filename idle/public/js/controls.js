const FORWARD = 0x001;
const BACK = 0x008;
const LEFT = 0x040;
const RIGHT = 0x200;

class Controls {

    static instance = null;

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

    rotateCamera(evt) {
        if (this.rotateActive) {
            this.yawDelta = -evt.movementX;
            this.pitchDelta = -evt.movementY;
        }
    }

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

    _addVelocity(velocity, vector, gain) {
        vec3.add(
            velocity,
            velocity,
            vec3.scale(vec3.create(), vector, gain)
        );
    }
}
