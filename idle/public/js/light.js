class Light {

    static Directional = 0;
    static Point = 1;
    static Spot = 2;


/*
dist    Kc      Kl      Kq
---------------------------
7 	    1.0 	0.7 	1.8
13 	    1.0 	0.35 	0.44
20 	    1.0 	0.22 	0.20
32 	    1.0 	0.14 	0.07
50 	    1.0 	0.09 	0.032
65 	    1.0 	0.07 	0.017
100 	1.0 	0.045 	0.0075
160 	1.0 	0.027 	0.0028
200 	1.0 	0.022 	0.0019
325 	1.0 	0.014 	0.0007
600 	1.0 	0.007 	0.0002
3250 	1.0 	0.0014 	0.000007
*/

    constructor(type=null) {
        this.type = type || Light.Directional;
        this.color = vec3.fromValues(2.0, 2.0, 2.0);
        this.position = vec3.fromValues(0.0, 0.0, 0.0);
        this.direction = vec3.fromValues(0.0, 0.0, -1.0);
        this.linear = 0.045;
        this.quadratic = 0.0075;
        this._init = false;
    }

    initialize(loc) {
        let lightLoc =`uLights[${loc}]`;
        this._typeLoc = `${lightLoc}.type`;
        this._colorLoc = `${lightLoc}.color`;
        this._directionLoc = `${lightLoc}.direction`;
        this._positionLoc = `${lightLoc}.position`;
        this._linearLoc = `${lightLoc}.linear`;
        this._quadraticLoc = `${lightLoc}.quadratic`;
        this._init = true;
    }

    render(gl, programInfo) {
        if (this._init) {
            gl.uniform1i(programInfo.uniforms[this._typeLoc], this.type);
            gl.uniform3fv(programInfo.uniforms[this._colorLoc], this.color);
            if (this.type == Light.Point) {
                gl.uniform3fv(programInfo.uniforms[this._positionLoc], this.position);
                // gl.uniform1f(programInfo.uniforms[this._linearLoc], this.linear);
                // gl.uniform1f(programInfo.uniforms[this._quadraticLoc], this.quadratic);
            }
            else if (this.type == Light.Directional) {
                gl.uniform3fv(programInfo.uniforms[this._directionLoc], this.direction);
            }
        }
    }
}