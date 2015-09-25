/* global THREE, doc, Util, $V */

/** 
 *  My Particle System class
 */

/** constructor 
function ParticleSystem(scene, x){
    this.initVis(scene, x);
    this.index = 0;
    this.max = 1000;
    this.x = x;
    this.particleAttributes = [this.max];
    
    var particles = new THREE.Geometry();
    var pMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 10
    });
        
    // now create the individual particles
    for (var i = 0; i < this.max; i++) {

        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 500 - 250,
            pY = Math.random() * 500 - 250,
            pZ = Math.random() * 500 - 250,
            particle = new THREE.Vector3(pX, pY, pZ);

        // add it to the geometry
        particles.vertices.push(particle);
        this.particleAttributes[i] = {};
    }
    
    var particleSystem = new THREE.Points(particles ,pMaterial );
    scene.add(particleSystem);    
}
*/

/** constructor using sprites instead of vertices in THREE.Points */ 
function ParticleSystem(scene, x){
    this.initVis(scene, x);
    this.index = 0;
    this.max = 1000;
    this.x = x;
    this.particles = [];
    
    for (var i = 0; i < this.max; i++) {

        var pX = Util.getRandom(-100, 100);
        var pY = Util.getRandom(-100, 100);
        var pZ = Util.getRandom(-100, 100);
        var randX = $V([pX, pY, pZ]);

        var sprite = initSprite(randX);

        // add it to the geometry
        this.particles.push({visual: sprite, x: randX});
        scene.add(sprite);
    }
}


/** Creates a canvas with the given text then renders that as a sprite. TODO performance? */
function initSprite(v){

    var canvas = doc.createElement('canvas');
    var size = 100;
    canvas.width = size;
    canvas.height = size;
    
    var material = new THREE.SpriteMaterial( {
            color: Math.random() * 0x808008 + 0x808080,
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 5, 5, 1 ); 
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
ParticleSystem.prototype.addParticles = function(count, opts){
    for (var i=0; i < count; i++){
        this.index++;
        if (this.index >= this.max) {
            this.index = 0;
        }
        
        this.turnOn(this.index, opts);
    }
};

/** hide the particle at given index */
ParticleSystem.prototype.turnOff = function(index, opts){
    this.particles[index].visual.visible = false;
    //this.particleSystem.vertices[index].
};

/** show the particle at the given index */
ParticleSystem.prototype.turnOn = function(index, opts){
    this.turnOff(index);
    this.particles[index].visual.visible = true;
    
    var pX = Util.getRandom(-100, 100);
    var pY = Util.getRandom(-100, 100);
    var pZ = Util.getRandom(-100, 100);
    
    this.particles[index].visual.position.set(pX, pY, pZ);
    
    this.particles[index].v = opts.v;
    this.particles[index].age = 0;    
};

/** move the particle at the given index to the new position */
ParticleSystem.prototype.moveParticle = function(index, x){
    this.particles[index].x = x;
    this.particles[index].visual.position.set(x.elements[0], x.elements[1], x.elements[2]);
};

/** give the particle a random color */
ParticleSystem.prototype.changeColor = function(index){
    this.particles[index].visual.material.color.setHex(0xffffff * Math.random());
};