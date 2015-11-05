/* global THREE, doc, Util */

/** 
 *  Bass class. Ba-dum-tiss
 */

var START_X = new THREE.Vector3(0,0,0);
var START_V = new THREE.Vector3(0,0,0);

function Springy(scene, callback, fish){ 
    
    //for testing torsional springs. ended up not working
/*    var geom = new THREE.Geometry();
    geom.vertices.push(new THREE.Vector3(0,0,-10));
    geom.vertices.push(new THREE.Vector3(0,0,10));
    geom.vertices.push(new THREE.Vector3(-10,10,0));
    geom.vertices.push(new THREE.Vector3(10,10,0));    

    geom.faces.push( new THREE.Face3( 0, 1, 2, new THREE.Vector3(1,1,1) ) );
    geom.faces.push( new THREE.Face3( 1, 0, 3, new THREE.Vector3(0,0,-10) ) );    
    geom.computeFaceNormals();
    
    this.mesh = new THREE.Mesh( geom, new THREE.MeshNormalMaterial({ wireframe: true }) );
    
    this.count = this.mesh.geometry.vertices.length;
    this.STATE = new Array(this.count * 2);

    for (var i = 0; i < this.count; i++) {
        this.mesh.geometry.vertices[i].mass = 0.1;

        this.STATE[i] = new THREE.Vector3(
            this.mesh.geometry.vertices[i].x,
            this.mesh.geometry.vertices[i].y,
            this.mesh.geometry.vertices[i].z
        );
        this.STATE[i + this.count] = new THREE.Vector3(0,0,0);
    }

    Util.addStruts(this.mesh);
    scene.add(this.mesh);
    return;*/
    
    
    if (fish){
        var loader = new THREE.JSONLoader();
        loader.load( "js/bass_reduced.js", function( geometry ) {
            this.mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial( /*{ wireframe: true }*/ ) );
            this.mesh.scale.set(1, 1, 1);

            this.count = this.mesh.geometry.vertices.length;
            this.STATE = new Array(this.count * 2);
			
            for (var i = 0; i < this.count; i++) {
                //scale the mesh
                this.mesh.geometry.vertices[i].x *= 100;
                this.mesh.geometry.vertices[i].y *= 100;
                this.mesh.geometry.vertices[i].z *= 100;
                this.mesh.geometry.vertices[i].mass = 0.1;

                this.STATE[i] = new THREE.Vector3(
                    this.mesh.geometry.vertices[i].x,
                    this.mesh.geometry.vertices[i].y,
                    this.mesh.geometry.vertices[i].z
                );
                this.STATE[i + this.count] = new THREE.Vector3(0,0,0);
            }
            this.mesh.geometry.computeFaceNormals();
            Util.addStruts(this.mesh);
            scene.add(this.mesh);
            callback();
        }.bind(this) );
    }
    else {
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        geometry.rotateX(1);
        geometry.rotateY(1);
        geometry.rotateZ(1);

        this.mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial( /*{ wireframe: true }*/ ) );
        this.mesh.scale.set(1, 1, 1);

        this.count = this.mesh.geometry.vertices.length;
        this.STATE = new Array(this.count * 2);

        for (var i = 0; i < this.count; i++) {
            //scale the mesh
            this.mesh.geometry.vertices[i].x *= 10;
            this.mesh.geometry.vertices[i].y *= 10;
            this.mesh.geometry.vertices[i].z *= 10;
            this.mesh.geometry.vertices[i].mass = 0.5;

            this.STATE[i] = new THREE.Vector3(
                this.mesh.geometry.vertices[i].x,
                this.mesh.geometry.vertices[i].y,
                this.mesh.geometry.vertices[i].z
            );
            this.STATE[i + this.count] = new THREE.Vector3(0,0,0);
        }
        this.mesh.geometry.computeFaceNormals();    
        Util.addStruts(this.mesh);
        scene.add(this.mesh);
    }

}

/** remove the particle system */
Springy.prototype.delete = function(scene){
    scene.remove(this.mesh);
};

/** update all th particles to the right position from the state */
Springy.prototype.moveParticles = function(){  
    for (var i = 0; i < this.count; i++){
        this.mesh.geometry.vertices[i].copy(this.STATE[i]);
    }
};
