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
var CUBE_LEN = 10;

var VIEW_ANGLE = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var RADIUS = 1; //radius of sphere in meters

//we have six planes that we check for collision, defined by a point and the normal. 
//this data structure could be optimized
var planes = [
    {
        p: $V([0,RADIUS,0]), //bottom
        n: $V([0,1,0])
    }, 
    {
        p: $V([0,CUBE_LEN-RADIUS,0]), //top
        n: $V([0,-1,0])
    }, 
    {
        p: $V([0,0,CUBE_LEN-RADIUS]), //front
        n: $V([0,0,-1])
    }, 
    {
        p: $V([0,0,RADIUS]), //back
        n: $V([0,0,1])
    }, 
    {
        p: $V([RADIUS,0,0]), //left
        n: $V([1,0,0]),
        id: 'temp'
    }, 
    {
        p: $V([CUBE_LEN-RADIUS,0,0]), //right
        n: $V([-1,0,0]),
    }
];

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



/************* Assignment specific code begins here *************/

//variables that the user will be able to adjust
var G = new $V([0, -10, 0]); //the accel due to gravity in m/s^2 -9.81
var D = 0.4;
var H = 0.01; // in seconds. Step time
var H_MILLI = H * 1000; 
var CR = 0.5;
var CF = 0.5;

var sphere, clock;
function initMotion(){
    sphere = new Sphere(scene, [CUBE_LEN/2, CUBE_LEN/2, CUBE_LEN/2], [60, 16, 0], RADIUS);
    //sphere = new Sphere(scene, [0, 100, 0], [10,0,30]);
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    simulate();
    render();
}
initMotion();

function integrate(v1, v2, timestep){
    return v1.add(v2.multiply(timestep));
}

function simulate(){
    
    //TODO Collision Determination
    //TODO Collision Response
    
    var timestepRemain = H;
    var timestep = timestepRemain; // We try to simulate a full timestep 
    while (timestepRemain > 0) {
        
        //Euler integration for acceleration due to gravity accounting for air resistence
        //a = g - (d/m)v
        var acceleration = G.subtract(sphere.v.multiply(D/sphere.mass));
        
        var vNew = integrate(sphere.v, acceleration, timestep);
        var xNew = integrate(sphere.x, sphere.v, timestep);
        
        //old just gravity
        //var vNew = sphere.v.add(G.multiply(H));
        
        var collision = collisionFraction(sphere.x, xNew);
        if (collision){
            timestep = collision.fraction * timestep;
            vNew = integrate(sphere.v, acceleration, timestep);            
            
            vNew = collisionResponse(vNew, collision.normal);
            xNew = integrate(sphere.x, sphere.v, timestep);
        }
        
        timestepRemain = timestepRemain - timestep;

        sphere.v = vNew;
        sphere.x = xNew;
        sphere.visual.position.set(xNew.elements[0], xNew.elements[1], xNew.elements[2]);
    }
    
    //TODO AT REST DETECTION
    
    var waitTime = H_MILLI - clock.getDelta(); 

    //4 milliseconds is the minimum wait 
    //https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Minimum_delay_and_timeout_nesting
    if (waitTime < 4){
        console.log("simulation getting behind and slowing down!");
    }
    setTimeout(simulate, waitTime);
}

//smartly render
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //let the browser decide the best time to redraw
}
 
function collisionFraction(v1, v2){
    
    for (var i = 0; i < planes.length; i++){
        var plane = planes[i];
        var dOld = v1.subtract(plane.p).dot(plane.n);
        var dNew = v2.subtract(plane.p).dot(plane.n);
                    
        //check if they have the same sign
        //if dOld is zero then a collision just happened and we don't want to detect it again
        if (dOld*dNew > 0 || dOld === 0){
            continue;
        }
        else {
            return { 
                fraction: dOld / (dOld-dNew),
                normal: plane.n
            };
        }
    }
    
    return false;
}

function collisionResponse(vOld, n){
    var vNormalOld = n.multiply(vOld.dot(n));
    var vTanOld = vOld.subtract(vNormalOld);

    var vNormalNew = n.multiply(-1 * CR * (vOld.dot(n)));
    //TODO use the coulomb 
    var vTanNew = vOld.subtract(vNormalOld).multiply(1-CF);
    
    return vNormalNew.add(vTanNew);
}