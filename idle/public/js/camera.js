const MAX_PITCH = 1.5707963267948966;  // =(PI / 2.0) can rotate pitch at max 90 degrees up or down
const MAX_YAW = 6.283185307179586;  // =(PI * 2.0) can rotate yaw a full 360 degrees
const UP = vec3.fromValues(0.0, 1.0, 0.0);  // y axis is the constant UP axis
const CENTER = vec3.fromValues(0.0, 0.0, -1.0);  // point on the -z axis for default "look at" target
const ORIGIN = vec3.fromValues(0.0, 0.0, 0.0);  // default camera eye location


/**
 * @classdesc
 * This class stores and updates the view matrix and projection matrix. The projection matrix is used to set the angle for the field of view (fov), the aspect ratio, 
 * and the frustum bounds (bounds within which objects will be rendered). The projection matrix is usually configured once and remains a constant. The view matrix is 
 * updated on every update loop iteration and is used to convert objects from world space to view space coordinates. View space coordinates are multiplied by the projection
 * matrix to get the 2D screen space coordinates.
 * 
 * @class
 */
class Camera {
    /**
     * @constructor
     * @param {number} fieldOfView Field of view in radians
     * @param {number} aspect Typically screen width/height
     * @param {number} zNear Near bound of the frustum
     * @param {number} zFar Far bound of the frustum
     */
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

    /**
     * Adds the velocity (a directional vector with magnitude) to the current camera position effectively moving the camera along the 
     *   velocity axis a number of units equal to the velocity magnitude.
     * @param {vec3} velocity Velocity (see controls to learn more about how velocity is calculated and used to move the camera around)
     */
    translate(velocity) {
        vec3.add(this._position, this._position, velocity);
    }

    /**
     * The camera can rotate along two axis: The UP axis (which is a constant and will never change) and the FORWARD axis (can rotate about the UP axis but is always perpendicular 
     * to the x,z plane). The UP axis will never change; this is to ensure that the FORWARD axis will always remain perfectly perpendicular to the xz plane and that the camera
     * will never tilt either to the left or the right (i.e., the horizon should always be perfectly level). This behavior is good for FPS games. Not very good for flight 
     * simulators. To rotate the camera tilt, a new function would need written that could update the UP axis to allow for tilt.
     * 
     * This function updates the internal pitch and yaw values within the maximum bounds, updates the view target vector, and then updates the new FORWARD axis.
     * @param {number} yaw Rotation about the UP axis in radians
     * @param {number} pitch Rotation about the FORWARD axis in radians
     */
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

    /**
     * Update the view matrix with the current "look at target" vector
     */
    update() {
        mat4.lookAt(
            this._viewMatrix,
            this._position,
            vec3.add(vec3.create(), this._position, this._target),
            UP
        );
    }


    /**
     * @typedef {Object} ProgramInfo
     * @property {Object.<string, number>[]} attributes
     * @property {Object.<string, number>[]} uniforms
     */

    /**
     * Load the projection matrix and view matrix into the shader's uniform constants.
     * Shaders plot a pixel using this equation -> screenPosition: vec3 = projectionMatrix: mat4 * viewMatrix: mat4 * worldMatrix: mat4 * vertexPos: vec3
     * @param {WebGL2RenderingContext} gl 
     * @param {ProgramInfo} programInfo Used to load camera matrices into the shader program uniform variable constants
     */
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

    /**
     * Initialize the view matrix to point a certain direction
     * @param {vec3} eye initial camera position
     * @param {vec3} center initial center vector or target point to look at
     */
    _initViewMatrix(eye, center) {
        mat4.lookAt(
            this._viewMatrix, 
            eye, 
            vec3.add(vec3.create(), eye, center),
            UP
        );
    }

    /**
     * Initialize the projection matrix
     * @param {number} fieldOfView Field of view in radians
     * @param {number} aspect Typically screen width/height
     * @param {number} zNear Frustum minimum bounds; objects will not be rendered before zNear
     * @param {number} zFar Frustum maximum bounds; objects will not be rendered beyond zFar
     */
    _initProjectionMatrix(fieldOfView, aspect, zNear, zFar) {
        this._projectionMatrix = mat4.perspective(
            mat4.create(),
            fieldOfView * Math.PI / 180, aspect, zNear, zFar
        );
    }
}
