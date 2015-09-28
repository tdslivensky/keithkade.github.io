/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, $V, ParticleSystem, window, Util*/ 

/** 
 *   I am using Three.js, a webgl library: http://threejs.org/
 *   I am using a Three.js orbital control library to let the user control the camera with the mouse
 *   I used this as my starting code: https://aerotwist.com/tutorials/getting-started-with-three-js/
 *   That contained the basics of setting up a scene, camera, light, and object
 * 
 *   For vector operations I am using Sylvestor.js http://sylvester.jcoglan.com/
 *   For the gaussian distribution I am using https://www.npmjs.com/package/gaussian
 * 
 *   The only issue I was unable to figure out was that if you run the simulation repeatedly 
 *   without refreshing the page, it speeds up
 *    
 *   @author: Kade Keith
 */

var doc = document; //shorthand

var SCENE_WIDTH = window.innerWidth - 430; //430 is width of options panel
var SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 

var FIELD_OF_VIEW = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var scene = new THREE.Scene();
var renderer = initRenderer();
var camera = initCamera();
var light = initLight();
var axes = initAxes();
var particleSys;
var clock;
var isSimulating;   //is the simulation currently running?


//Physics variables
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
var PPS = 10;      // particles generated per second


/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();
    
    particleSys = new ParticleSystem(scene, $V([initialX.x, initialX.y, initialX.z]), 'gaussian');
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    isSimulating = true;
    simulate();
    render();
}
initMotion();
//setInterval(particleSystem.addParticles.bind(particleSystem), 1000, 20, {v: $V([initialV.x, initialV.y, initialV.z])});

/** Euler integration */
function integrate(v1, v2, timestep){
    return v1.add(v2.multiply(timestep));
}

var particleFraction = 0;
/** the main simulation loop. recursive */ 
function simulate(){ 
    var timestep = H;
    
    var particleCount = H * PPS;
    if (particleCount < 1) {
        particleFraction += particleCount;
        if (particleFraction > 1){
            particleCount = 1;
            particleFraction = 0;
        }
        else {
            particleCount = 0;
        }
    }
    
    particleSys.generate(particleCount, {v: $V([initialV.x, initialV.y, initialV.z])});
    
    /* 

    for each particle generator k do 
        generator[k].GenerateParticles(particlelist, t, h);
    end
    
    particlelist.TestAndDeactivate(t); 
    particlelist.ComputeAccelerations(t); 
    if t == output-time then
        particlelist.Display(); 
    end
    particlelist.Integrate(t, h); 
    n = n + 1;
    t = nh;

    */
  
    //for all the particles apply physics
    for (var i=0; i<particleSys.max; i++){
        if (particleSys.isVisible(i)){
            var vOld = particleSys.getV(i);
            var xOld = particleSys.getX(i);
            var acceleration = G.subtract(vOld.multiply(D)); //I give particles a mass of one
            var vNew = integrate(vOld, acceleration, timestep);
            var xNew = integrate(xOld, vOld, timestep);
            particleSys.moveParticle(i, xNew);
            particleSys.updateAge(i, timestep);
            particleSys.updateColor(i);
            
            particleSys.setV(i, vNew);
            particleSys.setX(i, xNew);
        }
    }

    var waitTime = H_MILLI - clock.getDelta(); 
    //4 milliseconds is the minimum wait for most browsers
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

/************* THREE.js boilerplate *************/

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

    camera.position.set(40, 40, 40);

    camera.lookAt(new THREE.Vector3(0,0,0)); //we want to focus on the center 
    
    scene.add(camera);
    
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    return camera;
}
    
/** create the point light and add it to the scene */
function initLight(){
    var pointLight = new THREE.PointLight(0x0000FF); // blue
    pointLight.position.set (10, 10, 300);

    scene.add(pointLight);
    return pointLight;
}

/** draw x, y and z axes */
function initAxes(){
    var length = 100;
    var axes = new THREE.Object3D();
    
    //lines
    axes.add(initLine(new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0), 0xff0000)); // X 
    axes.add(initLine(new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0), 0x00ff00)); // Y
    axes.add(initLine(new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length), 0x0000ff)); // Z
    
    //labels
    axes.add(initLabel('X','#ff0000', [20, 0, 0]));
    axes.add(initLabel('Y','#00ff00', [0, 20, 0]));
    axes.add(initLabel('Z','#0000ff', [0, 0, 20]));
    
    scene.add(axes);
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
    amap.minFilter = THREE.LinearFilter;

    var mat = new THREE.SpriteMaterial({
        map: amap,
        color: 0xffffff     
    });

    var sprite = new THREE.Sprite(mat);
    sprite.scale.set( 10, 10, 1 ); 
    sprite.position.set(coords[0], coords[1], coords[2]);
    return sprite;  
    
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

/** these might be able to be be optimized. lots of code */ 
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
    
    PPS = parseFloat(doc.getElementById("PPS").value); 

    H = parseFloat(doc.getElementById("H").value);    
    H_MILLI = H * 1000;    
    
    D = parseFloat(doc.getElementById("D").value);  
    CR = parseFloat(doc.getElementById("CR").value);    
    CF = parseFloat(doc.getElementById("CF").value);  
    
}

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

    doc.getElementById("PPS").value = 10;
    doc.getElementById("PPS-slider").value = 10; 

    doc.getElementById("H").value = 0.016;    
    H_MILLI = H * 1000;    
    
    doc.getElementById("D").value = 0.1;  
    doc.getElementById("CR").value = 0.5;    
    doc.getElementById("CF").value = 0.2;
    getUserInputs();
}

function randomizeUserInputs(){
    var randX = Util.getRandom(2,8);
    var randY = Util.getRandom(2,8);
    var randZ = Util.getRandom(2,8);

    doc.getElementById("p.x").value = randX;
    doc.getElementById("p.y").value = randY;
    doc.getElementById("p.z").value = randZ;
    doc.getElementById("p.x-slider").value = randX;
    doc.getElementById("p.y-slider").value = randY;
    doc.getElementById("p.z-slider").value = randZ;

    randX = Util.getRandom(-100, 100);
    randY = Util.getRandom(-100, 100);
    randZ = Util.getRandom(-100, 100);
    doc.getElementById("v.x").value = randX;
    doc.getElementById("v.y").value = randY;
    doc.getElementById("v.z").value = randZ; 
    doc.getElementById("v.x-slider").value = randX;
    doc.getElementById("v.y-slider").value = randY;
    doc.getElementById("v.z-slider").value = randZ;     
 
    randX = Util.getRandom(-10, 10);
    randY = Util.getRandom(-10, 10);
    randZ = Util.getRandom(-10, 10);
    doc.getElementById("g.x").value = randX;
    doc.getElementById("g.y").value = randY;
    doc.getElementById("g.z").value = randZ;
    doc.getElementById("g.x-slider").value = randX;
    doc.getElementById("g.y-slider").value = randY;
    doc.getElementById("g.z-slider").value = randZ;  
    
    var randPPS = Util.getRandom(1, 100);
    doc.getElementById("PPS").value = randPPS;  
    doc.getElementById("PPS-slider").value = randPPS;  

    doc.getElementById("H").value = Util.getRandom(0.016, 0.1);    
    H_MILLI = H * 1000;    
    
    doc.getElementById("D").value = Util.getRandom(0, 1);  
    doc.getElementById("CR").value = Util.getRandom(0, 1);    
    doc.getElementById("CF").value = Util.getRandom(0, 1);
    getUserInputs();
}