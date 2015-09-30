/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, $V, Sphere, window*/ 

/** 
 *   I am using Three.js, a webgl library: http://threejs.org/
 *   I am using a Three.js orbital control library to let the user control the camera with the mouse
 *   I used this as my starting code: https://aerotwist.com/tutorials/getting-started-with-three-js/
 *   That contained the basics of setting up a scene, camera, light, and object
 * 
 *   For vector operations I am using Sylvestor.js http://sylvester.jcoglan.com/
 * 
 *   The only issue I was unable to figure out was that if you run the simulation repeatedly 
 *   without refreshing the page, it speeds up
 *    
 *   @author: Kade Keith
 */

var doc = document; //shorthand

var SCENE_WIDTH = window.innerWidth - 430; //430 is width of options panel
var SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 
var CUBE_LEN = 20; //unless otherwise noted, measurements are usually in meters

var FIELD_OF_VIEW = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var RADIUS = 2; //radius of sphere in meters

var scene = new THREE.Scene();
var renderer = initRenderer();
var camera = initCamera();
var light = initLight();
var cube = initCube();
var axes = initAxes();
var sphere, clock;
var isSimulating;   //is the simulation currently running?

//we have six planes that we check for collision, defined by a point and the normal. 
//this data structure could probably be optimized
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
    }, 
    {
        p: $V([CUBE_LEN-RADIUS,0,0]), //right
        n: $V([-1,0,0]),
    }
];

/** create the renderer and add it to the scene */
function initRenderer(){
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xe8e8d6 , 1); //make the background grey

    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    doc.getElementById('webgl-container').appendChild(renderer.domElement);
    return renderer;
}

/** create the camera and add it to the scene */
function initCamera(){    
    var camera = new THREE.PerspectiveCamera( FIELD_OF_VIEW, ASPECT, NEAR, FAR);

    camera.position.set(CUBE_LEN*2, CUBE_LEN*2, CUBE_LEN*3);

    camera.lookAt(new THREE.Vector3(0,0,0)); //we want to focus on the center 
    
    scene.add(camera);
    
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    return camera;
}
    
/** create the point light and add it to the scene */
function initLight(){
    var pointLight = new THREE.PointLight(0x0000FF); // blue
    pointLight.position.set (CUBE_LEN/2, CUBE_LEN/2, 300);

    scene.add(pointLight);
    return pointLight;
}

/** 
 *  create the box and add it to the scene 
 *  What happens here is that I create both the box (mesh) and a box helper that 
 *  is the bounding box of that mesh. I set the original box to not be visible, leaving just the edges
 */
function initCube(){
    var geometry = new THREE.BoxGeometry(CUBE_LEN, CUBE_LEN, CUBE_LEN);
    var material = new THREE.MeshBasicMaterial( {color: 0x000000} );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.visible = false;
    mesh.position.set(CUBE_LEN/2, CUBE_LEN/2, CUBE_LEN/2);

    var box = new THREE.BoxHelper( mesh );
    box.material.color.set( 0xCC3300 );
    
    scene.add(mesh);
    scene.add(box);
    return box;
}

/** draw x, y and z axes */
function initAxes(){
    var length = CUBE_LEN * 3;
    var axes = new THREE.Object3D();
    
    //lines
    axes.add(initLine(new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0), 0xff0000)); // X 
    axes.add(initLine(new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0), 0x00ff00)); // Y
    axes.add(initLine(new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length), 0x0000ff)); // Z
    
    //labels
    axes.add(initLabel('X','#ff0000', [CUBE_LEN + 5, 0, 0]));
    axes.add(initLabel('Y','#00ff00', [0, CUBE_LEN + 5, 0]));
    axes.add(initLabel('Z','#0000ff', [0, 0, CUBE_LEN + 5]));
    
    //scene.add(axes);
    return axes;
}

/** Create a line that goes between the two points of the given color*/
function initLine(v1, v2, col){
    var material = new THREE.LineBasicMaterial({ color: col });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    var line = new THREE.Line(geometry, material);
    return line;
}

function toggleAxes(elem){
    if (elem.checked){
        scene.add(axes);
    }
    else {
        scene.remove(axes);
    }
}

/** Creates a canvas with the given text then renders that as a sprite. Original: http://stackoverflow.com/questions/14103986/canvas-and-spritematerial */
function initLabel(text, color, coords){

    var canvas = doc.createElement('canvas');
    var size = 300;
    canvas.width = size;
    canvas.height = size;
    
    var context = canvas.getContext('2d');
    context.textAlign = 'center';
    context.fillStyle = color;
    context.font = '90px Helvetica';
    context.fillText(text, size/2, size/2);

    var amap = new THREE.Texture(canvas);
    amap.needsUpdate = true;

    var mat = new THREE.SpriteMaterial({
        map: amap,
        color: 0xffffff     
    });

    var sprite = new THREE.Sprite(mat);
    sprite.scale.set( 10, 10, 1 ); 
    sprite.position.set(coords[0], coords[1], coords[2]);
    return sprite;  
    
}

/************* Assignment specific code begins here *************/

var G = new $V([0, -9.81, 0]);  // The accel due to gravity in m/s^2 
var minRestV = 0.7;          // minimum velocity to declare at rest

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var initialX = {};  // Position
var initialV = {};  // Velocity
var D;              // Air resitence
var CR;             // coefficient of restitution. 1 is maximum bouncy
var CF;             // coefficient of friction. 0 is no friction


/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();
    if (sphere){
        scene.remove(sphere.visual);
    }
    
    sphere = new Sphere(scene, [initialX.x, initialX.y, initialX.z], [initialV.x, initialV.y, initialV.z], RADIUS);
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    isSimulating = true;
    simulate();
    render();
}
initMotion();

/** Euler integration */
function integrate(v1, v2, timestep){
    return v1.add(v2.multiply(timestep));
}

/** the main simulation loop. recursive */ 
function simulate(){
    
    var timestepRemain = H;
    var timestep = timestepRemain; // We try to simulate a full timestep 
    
    while (timestepRemain > 0) {
        
        //Euler integration for acceleration due to gravity accounting for air resistence
        //a = g - (d/m)v
        var acceleration = G.subtract(sphere.v.multiply(D/sphere.mass));
        
        var vNew = integrate(sphere.v, acceleration, timestep);
        var xNew = integrate(sphere.x, sphere.v, timestep);
        
        var collision = collisionFraction(sphere.x, xNew);
        if (collision){

            //If the ball is at rest stop simulation
            if (atRest(vNew, acceleration, collision)){
                isSimulating = false;
                console.log("at rest");
                return;    
            }
            
            timestep = collision.fraction * timestep;
            vNew = integrate(sphere.v, acceleration, timestep);            
            
            vNew = collisionResponse(vNew, collision.normal);
            
            xNew = integrate(sphere.x, sphere.v, timestep);
        }
        else {
            timestep = timestepRemain;
        }

        timestepRemain = timestepRemain - timestep;
            
        sphere.v = vNew;
        sphere.x = xNew;
        sphere.visual.position.set(xNew.elements[0], xNew.elements[1], xNew.elements[2]);
    }
        
    var waitTime = H_MILLI - clock.getDelta(); 

    //4 milliseconds is the minimum wait 
    //https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Minimum_delay_and_timeout_nesting
    if (waitTime < 4){
        console.log("simulation getting behind and slowing down!");
    }
    setTimeout(simulate, waitTime);
}

/** rendering loop */
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //redraw whenever the browser refreshes
}

/** Detects at what fraction a collision occurs. Returns false if there is no collision. */
function collisionFraction(x1, x2){
    
    var collisions = [];
    
    for (var i = 0; i < planes.length; i++){
        var plane = planes[i];
        var dOld = x1.subtract(plane.p).dot(plane.n);
        var dNew = x2.subtract(plane.p).dot(plane.n);
                    
        //check if they have the same sign
        //if dOld is zero then a collision just happened and we don't want to detect it again
        if (dOld*dNew > 0 || dOld === 0){
            continue;
        }
        else {
            collisions.push({ 
                fraction: dOld / (dOld-dNew),
                normal: plane.n,
                point: plane.p
            });
        }
    }
    
    //return the collision with the minimum f
    if (collisions.length > 0){
        var minF = 1;
        var minIndex = 0;
        for (var j = 0; j < collisions.length; j++){
            //TODO when ball hits two planes at the same time it breaks (collisions[j].fraction == minF)
            if (collisions[j].fraction < minF){
                minF = collisions[j].fraction;
                minIndex = j;
            }
        }
        return collisions[minIndex];
    }
    else {
        return false;
    }
}

function collisionResponse(vOld, n){
    var vNormalOld = n.multiply(vOld.dot(n));
    var vTanOld = vOld.subtract(vNormalOld);

    var vNormalNew = n.multiply(-1 * CR * (vOld.dot(n)));
     
    //basic model of friction
    //var vTanNew = vOld.subtract(vNormalOld).multiply(1-CF);
    
    //coulomb model.
    var vTanNew = vTanOld.subtract(vTanOld.toUnitVector().multiply(Math.min(CF*magnitude(vNormalOld), magnitude(vTanOld))));
    
    return vNormalNew.add(vTanNew);
}

/**
 * Criteria for it being at rest.
 * 1. velocity less than minRestV
 * 2. dist less than minRestX (this is satisfied because I check during collisions. 
 * 3. acceleration is away from the surface
 */
function atRest(v, a, collision){
    if (magnitude(v) < minRestV && a.dot(collision.normal) < 0){
        return true;
    }
    return false;
}

/**
 *  Strangely, Sylvester doesn't have a magnitude function 
 */
function magnitude(v){
    var sum = 0;
    for (var i = 0; i < v.elements.length; i++){
        sum += Math.pow(v.elements[i], 2);
    }
    return Math.sqrt(sum);
}


/************* Functions for handling user input *************/

/** 
 * refresh the values of our constants on input change. and tell simulation to start back up if neccesary
 * also binds the sliders to the text inputs using the optional elem and id parameters
 */
function inputChange(elem, id){
    if (elem && id){
        doc.getElementById(id).value = elem.value;
    }
    getUserInputs();
    
    if (!isSimulating){
        isSimulating = true;
        simulate();
    }
}


function getUserInputs(){
    initialX.x = parseFloat(doc.getElementById("p.x").value);
    initialX.y = parseFloat(doc.getElementById("p.y").value);
    initialX.z = parseFloat(doc.getElementById("p.z").value);

    initialV.x = parseFloat(doc.getElementById("v.x").value);
    initialV.y = parseFloat(doc.getElementById("v.y").value);
    initialV.z = parseFloat(doc.getElementById("v.z").value); 
    
    G.elements[0] = parseFloat(doc.getElementById("g.x").value);
    G.elements[1] = parseFloat(doc.getElementById("g.y").value);
    G.elements[2] = parseFloat(doc.getElementById("g.z").value); 

    H = parseFloat(doc.getElementById("H").value);    
    H_MILLI = H * 1000;    
    
    D = parseFloat(doc.getElementById("D").value);  
    CR = parseFloat(doc.getElementById("CR").value);    
    CF = parseFloat(doc.getElementById("CF").value);    
}

/** this should be optimized. too much code */ 
function resetUserInputs(){
    doc.getElementById("p.x").value = 3;
    doc.getElementById("p.y").value = 7;
    doc.getElementById("p.z").value = 5;
    doc.getElementById("p.x-slider").value = 3;
    doc.getElementById("p.y-slider").value = 7;
    doc.getElementById("p.z-slider").value = 5;

    doc.getElementById("v.x").value = 30;
    doc.getElementById("v.y").value = 4;
    doc.getElementById("v.z").value = -10; 
    doc.getElementById("v.x-slider").value = 30;
    doc.getElementById("v.y-slider").value = 4;
    doc.getElementById("v.z-slider").value = -10;     
    
    doc.getElementById("g.x").value = 0;
    doc.getElementById("g.y").value = -9.81;
    doc.getElementById("g.z").value = 0;
    doc.getElementById("g.x-slider").value = 0;
    doc.getElementById("g.y-slider").value = -9.81;
    doc.getElementById("g.z-slider").value = 0;    

    doc.getElementById("H").value = 0.016;    
    H_MILLI = H * 1000;    
    
    doc.getElementById("D").value = 0.1;  
    doc.getElementById("CR").value = 0.5;    
    doc.getElementById("CF").value = 0.2;
    getUserInputs();
}

function randomizeUserInputs(){
    var randX = getRandomArbitrary(2,8);
    var randY = getRandomArbitrary(2,8);
    var randZ = getRandomArbitrary(2,8);

    doc.getElementById("p.x").value = randX;
    doc.getElementById("p.y").value = randY;
    doc.getElementById("p.z").value = randZ;
    doc.getElementById("p.x-slider").value = randX;
    doc.getElementById("p.y-slider").value = randY;
    doc.getElementById("p.z-slider").value = randZ;

    randX = getRandomArbitrary(-100, 100);
    randY = getRandomArbitrary(-100, 100);
    randZ = getRandomArbitrary(-100, 100);
    doc.getElementById("v.x").value = randX;
    doc.getElementById("v.y").value = randY;
    doc.getElementById("v.z").value = randZ; 
    doc.getElementById("v.x-slider").value = randX;
    doc.getElementById("v.y-slider").value = randY;
    doc.getElementById("v.z-slider").value = randZ;     
 
    randX = getRandomArbitrary(-10, 10);
    randY = getRandomArbitrary(-10, 10);
    randZ = getRandomArbitrary(-10, 10);
    doc.getElementById("g.x").value = randX;
    doc.getElementById("g.y").value = randY;
    doc.getElementById("g.z").value = randZ;
    doc.getElementById("g.x-slider").value = randX;
    doc.getElementById("g.y-slider").value = randY;
    doc.getElementById("g.z-slider").value = randZ;  
    
    doc.getElementById("H").value = getRandomArbitrary(0.016, 0.1);    
    H_MILLI = H * 1000;    
    
    doc.getElementById("D").value = getRandomArbitrary(0, 1);  
    doc.getElementById("CR").value = getRandomArbitrary(0, 1);    
    doc.getElementById("CF").value = getRandomArbitrary(0, 1);
    getUserInputs();
}

/**
 * Returns a random number between min (inclusive) and max (exclusive). 
 * Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}