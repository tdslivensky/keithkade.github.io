/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, $V, Sphere*/ 

/** 
 *   I am using Three.js, a webgl library: http://threejs.org/
 *   I used this as my starting code: https://aerotwist.com/tutorials/getting-started-with-three-js/
 *   That contained the basics of setting up a scene, camera, light, and object
 * 
 *   For vector operations I am using Sylvestor.js http://sylvester.jcoglan.com/
 *    
 *   @author: Kade Keith
 */

var doc = document; //shorthand

var SCENE_WIDTH = 650;
var SCENE_HEIGHT = 650;
var CUBE_LEN = 250;
var G = new $V([0, -9.81, 0]); //the accel due to gravity in m/s^2 -9.81
var H = 1; // in seconds. Step time
var H_MILLI = H * 1000; 



var VIEW_ANGLE = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

/** create the renderer and add it to the scene */
function initRenderer(){
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x888888 , 1); //make the background grey

    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    doc.getElementById('container').appendChild(renderer.domElement);
    return renderer;
}

/** create the camera and add it to the scene */
function initCamera(){
    var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

    camera.position.set(CUBE_LEN*2.1, CUBE_LEN*2.1, CUBE_LEN*2.6);

    camera.lookAt(new THREE.Vector3(0,0,0)); //we want to focus on the center always
    
    scene.add(camera);
    return camera;
}
    
/** create the point light and add it to the scene */
function initLight(){
    var pointLight = new THREE.PointLight(0x0000FF); // blue
    pointLight.position.set (CUBE_LEN/2, CUBE_LEN/2, 300);

    scene.add(pointLight);
    return pointLight;
}

/** create the box and add it to the scene 
 *  What happens here is that I create both the box (mesh) and a box helper that 
 *  is the bounding box of that mesh. I set the original box to not be visible,
 *  leacing just the edges
 */
function initCube(){
    var geometry = new THREE.BoxGeometry(CUBE_LEN, CUBE_LEN, CUBE_LEN);
    var material = new THREE.MeshBasicMaterial( {color: 0x000000} );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.visible = false;
    mesh.position.set(CUBE_LEN/2, CUBE_LEN/2, CUBE_LEN/2);

    var box = new THREE.BoxHelper( mesh );
    box.material.color.set( 0xff0000 );
    
    scene.add(mesh);
    scene.add(box);
    return box;
}

var scene = new THREE.Scene();
var renderer = initRenderer();
var camera = initCamera();
var light = initLight();
var cube = initCube();

var sphere = new Sphere(scene, [CUBE_LEN/2, 100, CUBE_LEN/2], [10,30,0]);

/************* Assignment specific code begins here *************/

var clock = new THREE.Clock();
clock.start();

function simulate(){
    //Euler integration
    var vNew = sphere.v.add(G.multiply(H));
    var xNew = sphere.x.add(sphere.v.multiply(H));
    
    sphere.v = vNew;
    sphere.x = xNew;
    sphere.visual.position.set(xNew.elements[0], xNew.elements[1], xNew.elements[2]);    
    
    var waitTime = H_MILLI - clock.getDelta(); 

    //4 milliseconds is the minimum wait 
    //https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Minimum_delay_and_timeout_nesting
    if (waitTime < 4){
        console.log("simulation getting behind and slowing down!");
    }
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
 