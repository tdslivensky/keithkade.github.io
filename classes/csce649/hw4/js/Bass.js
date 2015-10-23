/* global THREE, doc, Util */

/** 
 *  Bass class. Ba-dum-tiss
 */

var START_X = new THREE.Vector3(0,0,0);
var START_V = new THREE.Vector3(0,0,0);

var startGeom;

function Bass(scene, callback){    
    var loader = new THREE.JSONLoader();
    loader.load( "js/bass_model.js", function( geometry ) {
        this.mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.y = 0;
        this.mesh.position.x = 0;
        
        this.count = this.mesh.geometry.vertices.length;
        this.STATE = new Array(this.count * 2);
        
        for (var i = 0; i < this.count; i++) {
            //scale the mesh
            this.mesh.geometry.vertices[i].x *= 100;
            this.mesh.geometry.vertices[i].y *= 100;
            this.mesh.geometry.vertices[i].z *= 100;
            
            this.STATE[i] = new THREE.Vector3(
                this.mesh.geometry.vertices[i].x,
                this.mesh.geometry.vertices[i].y,
                this.mesh.geometry.vertices[i].z
            );
            this.STATE[i + this.count] = new THREE.Vector3(0,0,0);
        }
        
        scene.add(this.mesh);
        callback();
    }.bind(this) );
}

/** remove the particle system */
Bass.prototype.delete = function(scene){
    scene.remove(this.mesh);
};

/** update all th particles to the right position from the state */
Bass.prototype.moveParticles = function(){  
    for (var i = 0; i < this.count; i++){
        this.mesh.geometry.vertices[i].copy(this.STATE[i]);
    }
};