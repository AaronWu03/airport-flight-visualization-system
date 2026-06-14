import * as Cesium from 'cesium';

const CircleWaveMaterialSource = `
    czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        material.diffuse = 1.5 * color.rgb;
        vec2 st = materialInput.st;
        vec3 str = materialInput.str;
        float dis = distance(st, vec2(0.5, 0.5));
        float per = fract(time);
        if (abs(str.z) > 0.001) {
            discard;
        }
        if (dis > 0.5) {
            discard;
        } else {
            float perDis = 0.5 / count;
            float disNum;
            float bl = .0;
            for (int i = 0; i <= 9; i++) {
                if (float(i) <= count) {
                    disNum = perDis * float(i) - dis + per / count;
                    if (disNum > 0.0) {
                        if (disNum < perDis) {
                            bl = 1.0 - disNum / perDis;
                        } else if (disNum - perDis < perDis) {
                            bl = 1.0 - abs(1.0 - disNum / perDis);
                        }
                        material.alpha = pow(bl, gradient);
                    }
                }
            }
        }
        return material;
    }
`;

class CircleWaveMaterialProperty {
    constructor(ob) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.duration = Cesium.defaultValue(ob.duration, 1000);
        this.count = Cesium.defaultValue(ob.count, 2);
        if (this.count <= 0) {
            this.count = 1;
        }
        this.gradient = Cesium.defaultValue(ob.gradient, 0.1);
        if (this.gradient === 0) {
            this.gradient = 0;
        }
        if (this.gradient > 1) {
            this.gradient = 1;
        }
        this._time = new Date().getTime();
        this._type = 'CircleWaveMaterial';
        
        this._color = Cesium.defaultValue(ob.color, Cesium.Color.fromCssColorString('#FFA500'));
    }

    get isConstant() {
        return false;
    }

    get definitionChanged() {
        return this._definitionChanged;
    }

    get color() {
        return this._color;
    }

    set color(value) {
        this._color = value;
        this._definitionChanged.raiseEvent(this);
    }

    getType(_time) {
        return this._type;
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = this._color;
        result.time = ((new Date().getTime() - this._time) % this.duration) / this.duration;
        result.count = this.count;
        result.gradient = 1 + 10 * (1 - this.gradient);
        return result;
    }

    equals(other) {
        return this === other ||
            (other instanceof CircleWaveMaterialProperty &&
                Cesium.Property.equals(this._color, other._color));
    }
}

const registerMaterial = () => {
    if (!Cesium.Material._materialCache._materials['CircleWaveMaterial']) {
        Cesium.Material._materialCache.addMaterial('CircleWaveMaterial', {
            fabric: {
                type: 'CircleWaveMaterial',
                uniforms: {
                    color: new Cesium.Color(1, 0, 0, 1),
                    time: 1,
                    count: 1,
                    gradient: 0.1,
                },
                source: CircleWaveMaterialSource,
            },
            translucent: function(material) {
                return true;
            },
        });
    }
};

class CircleWave {
    constructor(viewer, id) {
        this.viewer = viewer;
        this.id = id;
        this.count = 3;
        this.entity = null;
        registerMaterial();
    }

    change_duration(d) {
        if (this.entity && this.entity._ellipse && this.entity._ellipse._material) {
            this.entity._ellipse._material.duration = d;
        }
    }

    change_waveCount(d) {
        this.count = d;
        if (this.entity && this.entity._ellipse && this.entity._ellipse._material) {
            this.entity._ellipse._material.count = d;
        }
    }

    add(position, color, maxRadius, duration, isedit = false, count = 4) {
        this.count = count;
        
        const colorObj = this.hexToRgba(color);
        const baseSize = 3000;
        const maxRadiusVal = 5000000;
        
        const material = new CircleWaveMaterialProperty({
            color: new Cesium.Color(colorObj.r, colorObj.g, colorObj.b, colorObj.a),
            duration: duration,
            count: count,
            gradient: 0.3,
        });
        
        const getDynamicRadius = () => {
            const height = this.viewer.camera.positionCartographic.height;
            const dynamicRadius = baseSize + Math.pow(height, 0.6) * 5;
            return Math.min(dynamicRadius, maxRadiusVal);
        };
        
        this.entity = this.viewer.entities.add({
            id: this.id,
            position: Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]),
            ellipse: {
                semiMinorAxis: new Cesium.CallbackProperty(getDynamicRadius, false),
                semiMajorAxis: new Cesium.CallbackProperty(getDynamicRadius, false),
                material: material,
            },
        });
        
        return this.entity;
    }

    remove() {
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
            this.entity = null;
        }
    }

    hexToRgba(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: 1
        } : { r: 1, g: 0, b: 0, a: 1 };
    }
}

export default CircleWave;