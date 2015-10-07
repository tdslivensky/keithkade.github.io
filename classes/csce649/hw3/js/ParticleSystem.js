/* global THREE, doc, Util, gaussian, Float32Array, initialX */

/** 
 *  My Particle System class. I use getters and settters so that I can be implementation agnostic. 
 *  I originally used sprites and then switched to vertices
 */


var CONE_SIZE = 50;

function Beezooka(scene, dist, max){
    this.particleLifespan = 10;
    this.index = 0;
    this.max = max;
    this.distribution = dist;
    this.particlesAttr = new Array(this.max);
    
    var geometry = new THREE.Geometry();

    for (var i = 0; i < this.max; i++) {
        var pX = Math.random() * 500 - 250,
            pY = Math.random() * 500 - 250,
            pZ = Math.random() * 500 - 250,
            particle = new THREE.Vector3(pX, pY, pZ);

        // add it to the geometry
        geometry.vertices.push(particle);
        this.particlesAttr[i] = {
            v : new THREE.Vector3(0,0,0)
        };
    }

    geometry.verticesNeedUpdate = true;
    
    var pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 10,
        map: THREE.ImageUtils.loadTexture( "bee.png" ),
        transparent: true,
    });
    pMaterial.alphaTest = 0.5; //this fixes the opacity issue becuase reasons
    
    this.points = new THREE.Points(geometry, pMaterial);
    this.points.sortParticles = true;
    scene.add(this.points);  
}

/** remove the particle system */
Beezooka.prototype.delete = function(scene){
    scene.remove(this.points);
};

/** Creates a canvas with the given text then renders that as a sprite */
function initSprite(v){

    var canvas = doc.createElement('canvas');
    var size = 200;
    canvas.width = size;
    canvas.height = size;
    
    var material = new THREE.SpriteMaterial( {
            color: {r: 255, g: 0, b: 0}
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 1, 1, 1 ); 
    sprite.position.set(v.x, v.y, v.z);
    sprite.visible = false;
    return sprite;  
}

/** ready aim fire boom */ 
Beezooka.prototype.fire = function(opts){
    
    var pX, pY, pZ, distributionX, distributionY, distributionZ;
    if (this.distribution == 'gaussian'){
        distributionX = gaussian(initialX.x, CONE_SIZE);        
        distributionY = gaussian(initialX.y, CONE_SIZE);
        distributionZ = gaussian(initialX.z, CONE_SIZE);
    }
    
    for (var i=0; i < this.max; i++){
        this.index++;
        if (this.index >= this.max) {
            this.index = 0;
        }
        
        if (this.distribution == 'gaussian'){
            pX = distributionX.ppf(Math.random());
            pY = distributionY.ppf(Math.random());
            pZ = distributionZ.ppf(Math.random());
        }
        else {
            pX = Util.getRandom(initialX.y-CONE_SIZE, initialX.x+CONE_SIZE);
            pY = Util.getRandom(initialX.y-CONE_SIZE, initialX.x+CONE_SIZE);
            pZ = Util.getRandom(initialX.z-CONE_SIZE, initialX.x+CONE_SIZE);
        }
        
        opts.x = new THREE.Vector3(pX, pY, pZ);
        
        this.turnOn(this.index, opts);
    }
};

/** show the particle at the given index */
Beezooka.prototype.turnOn = function(index, opts){
    this.turnOff(index);
    this.particlesAttr[index].visible = true;
    
    this.moveParticle(index, opts.x);
    
    this.particlesAttr[index].v.copy(opts.v);
    this.particlesAttr[index].age = Util.getRandom(0,2);    
};

/** hide the particle at given index */
Beezooka.prototype.turnOff = function(index, opts){
    this.particlesAttr[index].visible = false;
};

/** move the particle at the given index to the new position */
Beezooka.prototype.moveParticle = function(index, x){    
    this.points.geometry.vertices[index].copy(x);
};

Beezooka.prototype.getV = function(index){
    return this.particlesAttr[index].v;
};

Beezooka.prototype.getX = function(index){
    return this.points.geometry.vertices[index];
};

Beezooka.prototype.setV = function(index, v){
    this.particlesAttr[index].v.copy(v);
};

Beezooka.prototype.isVisible = function(index){
    return this.particlesAttr[index].visible;
};