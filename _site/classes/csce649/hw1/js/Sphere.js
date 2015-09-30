/*global THREE, $V, CUBE_LEN*/
/** 
 *  My custom sphere class
 */

/** contstructor */
function Sphere(scene, x, v, radius){
    this.x = $V(x);
    this.v = $V(v);
    this.mass = 1;
    this.radius = radius;
    this.initVis(scene, x);
}

/** create the sphere and add it to the scene */
Sphere.prototype.initVis = function(scene, x){

    var segments = 16;
    var rings = 16;

    var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC });

    var sphere = new THREE.Mesh( new THREE.SphereGeometry( this.radius, segments, rings), sphereMaterial);
    sphere.position.set(x[0], x[1], x[2]);
    scene.add(sphere);
    this.visual = sphere;
};