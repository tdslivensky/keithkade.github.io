/* global THREE, doc, Util, $V, gaussian, Float32Array, initialX */

/** 
 *  My Particle System class. I use getters and settters so that I can be implementation agnostic. 
 *  I originally used sprites and then switched to vertices
 */


var CONE_SIZE = 50;

function ParticleSystem(scene, dist){
    this.particleLifespan = 10;
    this.index = 0;
    this.max = 10000;
    this.distribution = dist;
    this.particlesAttr = new Array(this.max);
    
    this.vertices = new Float32Array(this.max * 3);
    this.colors = new Float32Array(this.max * 4);

    for (var i = 0; i < this.max; i++) {
        this.vertices[i * 3 + 0] = 0;
        this.vertices[i * 3 + 1] = 0;
        this.vertices[i * 3 + 2] = 0;
        this.colors[i * 4 + 0] = 1;
        this.colors[i * 4 + 1] = 0;
        this.colors[i * 4 + 2] = 0;
        this.colors[i * 4 + 3] = 0;
        this.particlesAttr[i] = {};
    }
      
    var uniforms = {};
    var pMaterial = new THREE.ShaderMaterial({
        uniforms : uniforms,
        vertexShader: doc.getElementById('vertexshader').text,
        fragmentShader: doc.getElementById('fragmentshader').text,
        transparent: true
    });
    
    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
    this.geometry.addAttribute('color', new THREE.BufferAttribute(this.colors, 4));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    this.particleSystem = new THREE.Points(this.geometry, pMaterial);
    scene.add(this.particleSystem);  
}

/** remove the particle system */
ParticleSystem.prototype.delete = function(scene){
    scene.remove(this.particleSystem);
};

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

/** turn on the next 'count' particles in our array based on the current index */ 
ParticleSystem.prototype.generate = function(count, opts){
    
    var pX, pY, pZ, distributionY, distributionZ;
    if (this.distribution == 'gaussian'){
        distributionY = gaussian(initialX.y, CONE_SIZE);
        distributionZ = gaussian(initialX.z, CONE_SIZE);
    }
    
    for (var i=0; i < count; i++){
        this.index++;
        if (this.index >= this.max) {
            this.index = 0;
        }
        
        if (this.distribution == 'gaussian'){
            pX = initialX.x;
            pY = distributionY.ppf(Math.random());
            pZ = distributionZ.ppf(Math.random());
        }
        else {
            pX = initialX.x;
            pY = Util.getRandom(initialX.y-CONE_SIZE, initialX.x+CONE_SIZE);
            pZ = Util.getRandom(initialX.z-CONE_SIZE, initialX.x+CONE_SIZE);
        }
        
        opts.x = $V([pX, pY, pZ]);
        
        this.turnOn(this.index, opts);
    }
};

/** show the particle at the given index */
ParticleSystem.prototype.turnOn = function(index, opts){
    this.turnOff(index);
    this.particlesAttr[index].visible = true;
    
    this.moveParticle(index, opts.x);
    
    this.particlesAttr[index].v = opts.v;
    this.particlesAttr[index].x = opts.x;
    this.particlesAttr[index].age = Util.getRandom(0,2);    
};

/** hide the particle at given index */
ParticleSystem.prototype.turnOff = function(index, opts){
    this.colors[index * 4 + 3] = 0; //set alpha to zero
    this.particlesAttr[index].visible = false;
};

/** move the particle at the given index to the new position */
ParticleSystem.prototype.moveParticle = function(index, x){    
    this.vertices[index * 3 + 0] = x.elements[0];
    this.vertices[index * 3 + 1] = x.elements[1];
    this.vertices[index * 3 + 2] = x.elements[2];

    this.particlesAttr[index].x = x;
};

/** update the particles color/opacity based on age */
ParticleSystem.prototype.updateAge = function(index, time){
    this.particlesAttr[index].age += time;
};

/** update the particles color/opacity based on age */
ParticleSystem.prototype.updateColor = function(index){
    var lifespanFraction = this.particlesAttr[index].age / this.particleLifespan;
    if (this.particlesAttr[index].age > this.particleLifespan){
        this.turnOff(index);
    }
    else {
        this.colors[index * 4 + 0] = Math.max(0.5, 1 - lifespanFraction);    // make it grey over time
        this.colors[index * 4 + 1] = Math.min(0.5, lifespanFraction);    
        this.colors[index * 4 + 2] = Math.min(0.5, lifespanFraction);         
        this.colors[index * 4 + 3] = 1 - lifespanFraction;    // alpha
    }
};

ParticleSystem.prototype.getV = function(index){
    return this.particlesAttr[index].v;
};

ParticleSystem.prototype.getX = function(index){
    return this.particlesAttr[index].x;
};

ParticleSystem.prototype.setV = function(index, v){
    this.particlesAttr[index].v = v;
};

ParticleSystem.prototype.setX = function(index, x){
    this.particlesAttr[index].x = x;
};

ParticleSystem.prototype.isVisible = function(index){
    return this.particlesAttr[index].visible;
};