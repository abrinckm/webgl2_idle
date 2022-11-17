const MAX_PITCH = 1.5707963267948966;
const MAX_YAW = 6.283185307179586;
const UP = vec3.fromValues(0.0, 1.0, 0.0);
const CENTER = vec3.fromValues(0.0, 0.0, -1.0);
const ORIGIN = vec3.fromValues(0.0, 0.0, 0.0);

class Camera {
    constructor(fieldOfView, aspect, zNear, zFar) {
        this._yaw = 0.0;
        this._pitch = 0.0;
        this._position = vec3.create();
        this._forward = vec3.clone(CENTER);
        this._right = vec3.fromValues(1.0, 0.0, 0.0);
        this._target = vec3.clone(CENTER);
        this._viewMatrix = mat4.create(); 
        this._projectionMatrix = mat4.create();
        this._initProjectionMatrix(
            fieldOfView, aspect, zNear, zFar
        );
        this._initViewMatrix(this._position, this._target);
    }

    translate(velocity) {
        vec3.add(this._position, this._position, velocity);
    }

    rotate(yaw, pitch) {
        this._yaw += yaw;
        this._yaw %= MAX_YAW;
        const newPitch = this._pitch + pitch;
        if (Math.abs(newPitch) <= MAX_PITCH) {
            this._pitch = newPitch;
        }
        vec3.rotateY(
            this._target,
            vec3.rotateX(
                vec3.create(), CENTER, ORIGIN, this._pitch
            ),
            ORIGIN,
            this._yaw
        );
        vec3.cross(
            this._forward,
            UP,
            vec3.cross(this._right, this._target, UP)
        );
    }

    update() {
        mat4.lookAt(
            this._viewMatrix,
            this._position,
            vec3.add(vec3.create(), this._position, this._target),
            UP
        );
    }

    render(gl, programInfo) {
        gl.uniformMatrix4fv(
            programInfo.uniforms.uProjectionMatrix,
            false,
            this._projectionMatrix,
        );
        gl.uniformMatrix4fv(
            programInfo.uniforms.uViewMatrix,
            false,
            this._viewMatrix,
        );
        gl.uniform3fv(
            programInfo.uniforms.uViewPos,
            this._position,
        );
    }

    _initViewMatrix(eye, center) {
        mat4.lookAt(
            this._viewMatrix, 
            eye, 
            vec3.add(vec3.create(), eye, center),
            UP
        );
    }

    _initProjectionMatrix(fieldOfView, aspect, zNear, zFar) {
        this._projectionMatrix = mat4.perspective(
            mat4.create(),
            fieldOfView * Math.PI / 180, aspect, zNear, zFar
        );
    }
}