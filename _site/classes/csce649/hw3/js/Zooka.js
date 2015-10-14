/* global THREE, doc, Util, gaussian, Float32Array, initialX */

/** 
 *  Beezooka, a variant of particle system. 
 */

var CONE_SIZE = 200;
var SPREAD = 25;

function Beezooka(scene, dist, max){
    this.particleLifespan = 10;
    this.index = 0;
    this.max = max;
    this.distribution = dist;
    this.STATE = new Array(this.max * 2);
    
    var geometry = new THREE.Geometry();

    for (var i = 0; i < this.max; i++) {
        var particle = new THREE.Vector3(0,0,0);
        geometry.vertices.push(particle);

        this.STATE[i] = new THREE.Vector3(0,0,0);
        this.STATE[i + this.max] = new THREE.Vector3(0,0,0);
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

/** ready aim fire boom */ 
Beezooka.prototype.fire = function(opts){
    
    var pX, pY, pZ, vX, vY, vZ, distributionX, distributionY, distributionZ, distributionX_2, distributionY_2, distributionZ_2;
    if (this.distribution == 'gaussian'){
        distributionX = gaussian(initialX.x, CONE_SIZE);        
        distributionY = gaussian(initialX.y, CONE_SIZE);
        distributionZ = gaussian(initialX.z, CONE_SIZE);

        distributionX_2 = gaussian(opts.v.x, SPREAD);        
        distributionY_2 = gaussian(opts.v.y, SPREAD);
        distributionZ_2 = gaussian(opts.v.z, SPREAD);        
    }
    
    for (var i=0; i < this.max; i++){
        
        //also randomize velocities a bit to make things more interesting
        if (this.distribution == 'gaussian'){
            pX = distributionX.ppf(Math.random());
            pY = distributionY.ppf(Math.random());
            pZ = distributionZ.ppf(Math.random());
            vX = distributionX_2.ppf(Math.random());
            vY = distributionY_2.ppf(Math.random());
            vZ = distributionZ_2.ppf(Math.random());            
        }
        else {
            pX = Util.getRandom(initialX.x - CONE_SIZE, initialX.x + CONE_SIZE);
            pY = Util.getRandom(initialX.y - CONE_SIZE, initialX.y + CONE_SIZE);
            pZ = Util.getRandom(initialX.z - CONE_SIZE, initialX.z + CONE_SIZE);
            vX = Util.getRandom(opts.v.y - SPREAD, opts.v.x + SPREAD);
            vY = Util.getRandom(opts.v.y - SPREAD, opts.v.x + SPREAD);
            vZ = Util.getRandom(opts.v.z - SPREAD, opts.v.x + SPREAD);            
        }
        
        //update the state
        this.STATE[i].x = pX;
        this.STATE[i].y = pY;
        this.STATE[i].z = pZ;
        this.STATE[i + this.max].x = vX;
        this.STATE[i + this.max].y = vY;
        this.STATE[i + this.max].z = vZ;
    }
    this.moveParticles();
};

/** update all th particles to the right position from the state */
Beezooka.prototype.moveParticles = function(){  
    for (var i = 0; i < this.max; i++){
        this.points.geometry.vertices[i].copy(this.STATE[i]);
    }
};