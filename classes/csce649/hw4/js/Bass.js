/* global THREE, doc, Util */

/** 
 *  Bass, a springy variant of particle system. 
 */

var SPREAD_X = 10;
var SPREAD_V = 10;
var START_X = new THREE.Vector3(0,0,0);
var START_V = new THREE.Vector3(0,0,0);

function Bass(scene){
    this.count = 100;
    this.STATE = new Array(this.count * 2);
    
    var geometry = new THREE.Geometry();

    for (var i = 0; i < this.count; i++) {
        var particle = new THREE.Vector3(0,0,0);
        geometry.vertices.push(particle);

        this.STATE[i] = new THREE.Vector3(0,0,0);
        this.STATE[i + this.count] = new THREE.Vector3(0,0,0);
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
Bass.prototype.delete = function(scene){
    scene.remove(this.points);
};

/** wub wub wub */ 
Bass.prototype.drop = function(opts){
    for (var i=0; i < this.count; i++){
        var pX = Util.getRandom(START_X.x - SPREAD_X, START_X.x + SPREAD_X);
        var pY = Util.getRandom(START_X.y - SPREAD_X, START_X.y + SPREAD_X);
        var pZ = Util.getRandom(START_X.z - SPREAD_X, START_X.z + SPREAD_X);
        var vX = Util.getRandom(START_V.y - SPREAD_V, START_V.x + SPREAD_V);
        var vY = Util.getRandom(START_V.y - SPREAD_V, START_V.x + SPREAD_V);
        var vZ = Util.getRandom(START_V.z - SPREAD_V, START_V.x + SPREAD_V);            
        
        //update the state
        this.STATE[i].x = pX;
        this.STATE[i].y = pY;
        this.STATE[i].z = pZ;
        this.STATE[i + this.count].x = vX;
        this.STATE[i + this.count].y = vY;
        this.STATE[i + this.count].z = vZ;
    }
    this.moveParticles();
};

/** update all th particles to the right position from the state */
Bass.prototype.moveParticles = function(){  
    for (var i = 0; i < this.count; i++){
        this.points.geometry.vertices[i].copy(this.STATE[i]);
    }
};