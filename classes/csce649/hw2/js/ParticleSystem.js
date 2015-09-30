/* global THREE, doc, Util, $V, gaussian */

/** 
 *  My Particle System class. I intentially use getters and settters so that I can be implementation agnostic. I am undecided between sprites and vertices
 */


var CONE_SIZE = 100;

/** constructor using sprites instead of vertices in THREE.Points */ 
function ParticleSystem(scene, x, dist){
    this.particleLifespan = 5;
    this.initVis(scene, x);
    this.index = 0;
    this.max = 1000;
    this.x = x;
    this.particles = [];
    this.distribution = dist;

    var pX, pY, pZ, distribution;
    if (dist == 'gaussian'){
        distribution = gaussian(this.x.elements[0], CONE_SIZE);
    }
    for (var i = 0; i < this.max; i++) {

        if (dist == 'gaussian'){
            pX = distribution.ppf(Math.random());
            pY = distribution.ppf(Math.random());
            pZ = distribution.ppf(Math.random());
        }
        else {
            pX = Util.getRandom(this.x.elements[0]-CONE_SIZE, this.x.elements[0]+CONE_SIZE);
            pY = Util.getRandom(this.x.elements[1]-CONE_SIZE, this.x.elements[1]+CONE_SIZE);
            pZ = Util.getRandom(this.x.elements[2]-CONE_SIZE, this.x.elements[2]+CONE_SIZE);
        }
        
        var randX = $V([pX, pY, pZ]);
        var sprite = initSprite(randX);

        // add it to the geometry
        this.particles.push({visual: sprite, x: randX});
        scene.add(sprite);
    }
}

/** remove the particle system */
ParticleSystem.prototype.delete = function(scene){
    scene.remove(this.sourceVis);
    for (var i = 0; i < this.max; i++) {
        // add it to the geometry
        scene.remove(this.particles[i].visual);
    }};

/** Creates a canvas with the given text then renders that as a sprite. TODO performance? */
function initSprite(v){

    var canvas = doc.createElement('canvas');
    var size = 100;
    canvas.width = size;
    canvas.height = size;
    
    var material = new THREE.SpriteMaterial( {
            //color: Math.random() * 0x808008 + 0x808080,
            color: {r: 255, g: 0, b: 0}
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 1, 1, 1 ); 
    sprite.position.set(v.elements[0], v.elements[1], v.elements[2]);
    sprite.visible = false;
    return sprite;  
}

/** create the generator and add it to the scene represented as sphere for now */
ParticleSystem.prototype.initVis = function(scene, x){
    var segments = 16;
    var rings = 16;

    var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC });

    var sphere = new THREE.Mesh( new THREE.SphereGeometry( 2, segments, rings), sphereMaterial);
    sphere.position.set(x.elements[0], x.elements[1], x.elements[2]);
    scene.add(sphere);
    this.sourceVis = sphere;
};

/** turn on the next 'count' particles in our array based on the current index */ 
ParticleSystem.prototype.generate = function(count, opts){
    
    var pX, pY, pZ, distribution;
    if (this.distribution == 'gaussian'){
        distribution = gaussian(this.x.elements[0], CONE_SIZE);
    }
    
    for (var i=0; i < count; i++){
        this.index++;
        if (this.index >= this.max) {
            this.index = 0;
        }
        
        if (this.distribution == 'gaussian'){
            pX = distribution.ppf(Math.random());
            pY = distribution.ppf(Math.random());
            pZ = distribution.ppf(Math.random());
        }
        else {
            pX = Util.getRandom(this.x.elements[0]-CONE_SIZE, this.x.elements[0]+CONE_SIZE);
            pY = Util.getRandom(this.x.elements[1]-CONE_SIZE, this.x.elements[1]+CONE_SIZE);
            pZ = Util.getRandom(this.x.elements[2]-CONE_SIZE, this.x.elements[2]+CONE_SIZE);
        }
        
        opts.x = $V([pX, pY, pZ]);
        
        this.turnOn(this.index, opts);
    }
};

/** hide the particle at given index */
ParticleSystem.prototype.turnOff = function(index, opts){
    this.particles[index].visual.visible = false;
};

/** show the particle at the given index */
ParticleSystem.prototype.turnOn = function(index, opts){
    this.turnOff(index);
    this.particles[index].visual.visible = true;
    
    this.particles[index].visual.position.set(opts.x.elements[0], opts.x.elements[1], opts.x.elements[2]);
    
    this.particles[index].v = opts.v;
    this.particles[index].x = opts.x;
    this.particles[index].age = 0;    
};

/** move the particle at the given index to the new position */
ParticleSystem.prototype.moveParticle = function(index, x){
    this.particles[index].x = x;
    this.particles[index].visual.position.set(x.elements[0], x.elements[1], x.elements[2]);
};

/** update the particles color/opacity based on age */
ParticleSystem.prototype.updateAge = function(index, time){
    this.particles[index].age += time;
};

/** update the particles color/opacity based on age */
ParticleSystem.prototype.updateColor = function(index){
    
    var lifespanFraction = this.particles[index].age / this.particleLifespan;
    if (this.particles[index].age > this.particleLifespan){
        this.turnOff(index);
    }
    else {
        this.particles[index].visual.material.opacity = 1 - lifespanFraction;
        this.particles[index].visual.material.color.setRGB((1 - lifespanFraction), 0, 0); 
    }
};

ParticleSystem.prototype.getV = function(index){
    return this.particles[index].v;
};

ParticleSystem.prototype.getX = function(index){
    return this.particles[index].x;
};

ParticleSystem.prototype.setV = function(index, v){
    this.particles[index].v = v;
};

ParticleSystem.prototype.setX = function(index, x){
    this.particles[index].x = x;
};

ParticleSystem.prototype.isVisible = function(index){
    return this.particles[index].visual.visible;
};