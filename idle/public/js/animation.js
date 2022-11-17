class KeyFrame extends Transform {
    constructor(time, scale, rotation, translation) {
        super(scale, rotation, translation);
        this.time = time;
    }

    static create() {
        return new KeyFrame(0, vec3.fromValues(1.0, 1.0, 1.0), quat.create(), vec3.create());
    }

    clone() {
        return new KeyFrame(
            this.time,
            vec3.clone(this._scale),
            quat.clone(this._rotation),
            vec3.clone(this._translation)
        );
    }

    lerp(frame, amount) {
        return new KeyFrame(0,
            vec3.lerp(vec3.create(), this._scale, frame._scale, amount),
            quat.slerp(quat.create(), this._rotation, frame._rotation, amount),
            vec3.lerp(vec3.create(), this._translation, frame._translation, amount)
        );
    }
}

class Animation {
    constructor() {
        this._enabled = true;
    }

    pause() {
        this._enabled = false;
    }

    unpause() {
        this._enabled = true;
    }

    update(/*deltaTime, destMatrix*/) {
        throw new Error("Class inheriting from Animation should implement update()");
    }
}

class KeyFrameAnimation extends Animation {
    constructor(keyFrames) {
        super();
        this._keyFrames = keyFrames;
        this._currentFrameTime = 0.0;
        this._currentFrame = this._keyFrames[0].clone();
        this._startKeyFrameTime = 0.0;
        this._nextKeyFrameIndex = 1;
        this._nextKeyFrame = this._keyFrames[1];
        this._timeScale = this._nextKeyFrame.time;
    }

    _updateMatrix(frame, destMatrix) {
        mat4.fromRotationTranslationScale(
            destMatrix,
            frame._rotation,
            frame._translation,
            frame._scale
        );
    }

    update(deltaTime, destMatrix) {
        if (!this._enabled) {
            return false;
        }
        this._currentFrameTime += deltaTime;
        if (this._currentFrameTime >= this._nextKeyFrame.time) {
            this._nextKeyFrameIndex += 1;
            if (this._nextKeyFrameIndex < this._keyFrames.length) {
                this._startKeyFrameTime = this._nextKeyFrame.time;
                this._currentFrame = this._nextKeyFrame.clone();
            }
            else {
                this._nextKeyFrameIndex = 1;
                this._startKeyFrameTime = 0;
                this._currentFrame = this._keyFrames[0].clone();
                this._currentFrameTime -= this._nextKeyFrame.time;
            }
            this._nextKeyFrame = this._keyFrames[this._nextKeyFrameIndex];
            this._timeScale = this._nextKeyFrame.time - this._startKeyFrameTime;
        }
        let lerpAmount = (this._currentFrameTime - this._startKeyFrameTime) / this._timeScale;
        const frame = this._currentFrame.lerp(this._nextKeyFrame, lerpAmount);
        this._updateMatrix(frame, destMatrix);
        return true;
    }
}
