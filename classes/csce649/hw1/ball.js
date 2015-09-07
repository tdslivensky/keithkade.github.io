/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console*/ 

/** 
 *   I am using Three.js, a webgl library: http://threejs.org/
 *   I used this as my starting code: https://aerotwist.com/tutorials/getting-started-with-three-js/
 *   That contained the basics of setting up a scene, camera, light, and object
 *    
 *   @author: Kade Keith
 */

var doc = document; //shorthand

var WIDTH = 600;
var HEIGHT = 600;

var VIEW_ANGLE = 45;
var ASPECT = WIDTH / HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var elem = doc.getElementById('container');
var renderer, camera, scene;

/** Sets up the renderer, camera, scene, and light, and attaches it to the DOM */
function init(){
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x00FF00, 1); //make the background green

    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

    scene = new THREE.Scene();
    scene.add(camera);

    camera.position.z = 400;

    renderer.setSize(WIDTH, HEIGHT);

    elem.appendChild(renderer.domElement);

    var pointLight = new THREE.PointLight(0x0000FF); // blue

    pointLight.position.x = 0;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    scene.add(pointLight);
}
init();

var sphere;
/** create the sphere and add it to the scene */
function addSphere(){
    var radius = 50;
    var segments = 16;
    var rings = 16;

    var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC });

    sphere = new THREE.Mesh( new THREE.SphereGeometry( radius, segments, rings), sphereMaterial);
    scene.add(sphere);
}
addSphere();

/************* Assignment specific code begins here *************/

var clock = new THREE.Clock();
clock.start();

var stepTime = 10;
function simulate(){
    //calculate needed movement
    sphere.position.set(sphere.position.x+1, sphere.position.y+1, sphere.position.z+1);
    
    var waitTime = stepTime - clock.getDelta();
    //console.log(waitTime);
    setTimeout(simulate, waitTime);
}

clock.getDelta();
simulate();

//smartly render
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //let the browser decide the best time to redraw
}
render();
 