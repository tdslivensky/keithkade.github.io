/*global document, THREE, setInterval, setTimeout*/ 

/** 
    I am using Three.js, a webgl library: http://threejs.org/
    I used this as my starting code: https://aerotwist.com/tutorials/getting-started-with-three-js/
    @author: Kade
*/

var doc = document;

// scene size
var WIDTH = 600;
var HEIGHT = 600;

// set some camera attributes
var VIEW_ANGLE = 45;
var ASPECT = WIDTH / HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var container = doc.getElementById('container');

// create a WebGL renderer, camera, and  scene
var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x00FF00, 1); //make the background green

var camera =
  new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR);

var scene = new THREE.Scene();

// add the camera to the scene
scene.add(camera);

// the camera starts at 0,0,0, so pull it back
camera.position.z = 400;

// start the renderer
renderer.setSize(WIDTH, HEIGHT);

// attach the render-supplied DOM element
container.appendChild(renderer.domElement);

// set up the sphere vars
var radius = 50;
var segments = 16;
var rings = 16;

// create the sphere's material
var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC });

// create a new mesh 
var sphere = new THREE.Mesh( new THREE.SphereGeometry( radius, segments, rings), sphereMaterial);

// add the sphere to the scene
scene.add(sphere);

// create a point light
var pointLight = new THREE.PointLight(0x0000FF); // blue

// set its position
pointLight.position.x = 0;
pointLight.position.y = 50;
pointLight.position.z = 130;

// add light to the scene
scene.add(pointLight);

//draw it
renderer.render(scene, camera);

function move(){
    var x = Math.floor((Math.random() * 200) - 100);
    var y = Math.floor((Math.random() * 200) - 100);
    var z = Math.floor((Math.random() * 200) - 100);
    sphere.position.set(x, y, z);
    renderer.render(scene, camera);
}
setInterval(move, 100);