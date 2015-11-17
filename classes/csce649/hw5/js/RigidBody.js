/* global THREE, doc, Util, State */

/** 
 *  Rigid body class.
 */

var START_X = new THREE.Vector3(0,0,0);
var START_V = new THREE.Vector3(0,0,0);

function RigidBody(scene, callback, fish){ 
    
    if (fish){
        var loader = new THREE.JSONLoader();
        loader.load( "js/bass_reduced.js", function( geometry ) {
            this.mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial( /*{ wireframe: true }*/ ) );
            callback();
        }.bind(this) );
    }
    else {
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        this.mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial( /*{ wireframe: true }*/ ) );
        this.mesh.scale.set(1, 1, 1);

        this.mass = 12;
        
        this.I_0 = new THREE.Matrix4().set(
            this.mass * 2 / 12,0,0,0,
            0,this.mass * 2 / 12,0,0,
            0,0,this.mass * 2 / 12,0,
            0,0,0,1);
        
        this.I_0_inv = new THREE.Matrix4().getInverse(this.I_0);
        
        this.I = this.I_0.clone();
        
        this.STATE = new State();
        this.STATE.q.setFromAxisAngle(new THREE.Vector3(1,0,0), 2);
        this.mesh.geometry.verticesNeedUpdate = true;
        
        for (var i = 0; i < this.mesh.geometry.vertices.length; i++) {
            //scale the mesh in local coordinates
            this.mesh.geometry.vertices[i].x *= 10;
            this.mesh.geometry.vertices[i].y *= 10;
            this.mesh.geometry.vertices[i].z *= 10;
        }
        Util.addEdges(this.mesh);
        scene.add(this.mesh);
    }
}

/** remove the particle system */
RigidBody.prototype.delete = function(scene){
    scene.remove(this.mesh);
};