/*global THREE, $V, CUBE_LEN*/
/** 
 *  My custom sphere class
 */

/** contstructor */
function Sphere(scene, x, v){
    this.visual = initSphereVisual(scene, x);
    this.x = $V(x);
    this.v = $V(v);
    this.mass = 1;
}

/** create the sphere and add it to the scene */
function initSphereVisual(scene, x){
    var radius = 30;
    var segments = 16;
    var rings = 16;

    var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC });

    var sphere = new THREE.Mesh( new THREE.SphereGeometry( radius, segments, rings), sphereMaterial);
    sphere.position.set(x[0], x[1], x[2]);
    scene.add(sphere);
    return sphere;
}