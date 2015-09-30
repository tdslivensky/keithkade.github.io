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

var panelWidth = 430;
if (window.innerWidth < 700) panelWidth = 0;
var SCENE_WIDTH = window.innerWidth - panelWidth; //430 is width of options panel
var SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 

var FIELD_OF_VIEW = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var planeAttr = {
    p: [20, 0 , 0],
    //r: [Math.radians(120), Math.radians(45), Math.radians(10)]

    r: [Math.radians(90), Math.radians(70), Math.radians(0)]
};

var scene = new THREE.Scene();
var renderer = initRenderer();
var camera = initCamera();
var light = initLight();
var axes = initAxes();
var polygon = initPolygon();
var plane = initPlane();
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
    if (particleSys){
        particleSys.delete(scene);
    }
    
    particleSys = new ParticleSystem(scene, $V([initialX.x, initialX.y, initialX.z]), 'gaussian');
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    isSimulating = true;
    simulate();
    render();
}
initMotion();

/** the rendering of the surface that particles will bounce off of. */
function initPolygon(){
    var geometry = new THREE.PlaneGeometry(20, 20);
    var material = new THREE.MeshBasicMaterial( {color: 0xa0a0ff, side: THREE.DoubleSide} );
    var polygon = new THREE.Mesh( geometry, material );
        
    polygon.position.set(planeAttr.p[0], planeAttr.p[1], planeAttr.p[2]);
    
    polygon.geometry.applyMatrix(
        new THREE.Matrix4().makeRotationFromEuler(
            new THREE.Euler( planeAttr.r[0], planeAttr.r[1], planeAttr.r[2])
        )
    );
        
    var wireframe = new THREE.WireframeHelper( polygon, 0x00ff00 );
    scene.add(polygon);
    scene.add(wireframe);
    return polygon;
}

/** the internal representation of the surface that particles will bounce off of. */
function initPlane(){
    var plane = new THREE.Plane( new THREE.Vector3(0, 0, 1), 0);
    plane.applyMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(
            new THREE.Euler( planeAttr.r[0], planeAttr.r[1], planeAttr.r[2])
        )
    );
    plane.p = $V([planeAttr.p[0], planeAttr.p[1], planeAttr.p[2]]);
    plane.n = $V([plane.normal.x, plane.normal.y, plane.normal.z]);
    return plane;
}

/** Euler integration */
function integrate(v1, v2, timestep){
    return v1.add(v2.multiply(timestep));
}

var particleFraction = 0;
/** the main simulation loop. recursive */ 
function simulate(){ 
    var timestep = H;
    
    //generate new particles. keep track of fractions
    var particleCount = H * PPS;
    particleFraction += particleCount - Math.floor(particleCount);
    particleCount = Math.floor(particleCount);
    if (particleFraction > 1){
        particleCount += 1;
        particleFraction = particleFraction - 1;
    }
    
    particleSys.generate(particleCount, {v: $V([initialV.x, initialV.y, initialV.z])});
      
    //for all the particles apply physics
    for (var i=0; i<particleSys.max; i++){
        if (particleSys.isVisible(i)){
            var vOld = particleSys.getV(i);
            var xOld = particleSys.getX(i);
            var acceleration = G.subtract(vOld.multiply(D)); //I give particles a mass of one
            var vNew = integrate(vOld, acceleration, timestep);
            var xNew = integrate(xOld, vOld, timestep);
            
            //collision detection and response. if there is no collision then no change
            var collision = collisionDetectionAndResponse(xOld, xNew, vOld, vNew);
            xNew = collision.xNew;
            vNew = collision.vNew;
            
            particleSys.moveParticle(i, xNew);
            particleSys.updateAge(i, timestep);
            particleSys.updateColor(i);
                        
            particleSys.setV(i, vNew);
            particleSys.setX(i, xNew);
        }
    }

    var waitTime = H_MILLI - clock.getDelta(); 
    if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
        console.log("simulation getting behind and slowing down!");
    }
    setTimeout(simulate, waitTime);
}

function collisionDetectionAndResponse(x1, x2, v1, v2){
    //return true;
    
    
    //x′[n+1] = x[n+1] − (1 + ρ)d[n+1]nˆ.
    
    //v′[n+1] = −ρvn + (1 − μ)vt,
    
    var dOld = x1.subtract(plane.p).dot(plane.n);
    var dNew = x2.subtract(plane.p).dot(plane.n);
    //check if they have the same sign
    if (dOld*dNew <= 0){
        
        var fraction = dOld / (dOld-dNew);
        var collisionX = integrate(x1, v1, fraction * H);
        
        var vNormal = plane.n.multiply(v1.dot(plane.n));
        if (pointInPolygon(collisionX)){
        
            var response = {};
            response.xNew = x2.subtract(plane.n.multiply(dNew * (1 + CR)));

            var vTan = v1.subtract(vNormal);

            response.vNew = vNormal.multiply(-1 * CR).add(vTan.multiply(1 - CF));

            return response;
        }
    }
    
    return {xNew: x2, vNew: v2};
}

function pointInPolygon(x){

    //these calculations should not be done every time
    //FIXME not working on bottom triangle
    for (var i=0; i < polygon.geometry.faces.length; i++){
        
        var face = polygon.geometry.faces[i];
        var p0 = $V([polygon.geometry.vertices[face.a].x + plane.p.elements[0], polygon.geometry.vertices[face.a].y + plane.p.elements[1],  polygon.geometry.vertices[face.a].z + plane.p.elements[2]]);
        var p1 = $V([polygon.geometry.vertices[face.b].x + plane.p.elements[0], polygon.geometry.vertices[face.b].y + plane.p.elements[1],  polygon.geometry.vertices[face.b].z + plane.p.elements[2]]);
        var p2 = $V([polygon.geometry.vertices[face.c].x + plane.p.elements[0], polygon.geometry.vertices[face.c].y + plane.p.elements[1],  polygon.geometry.vertices[face.c].z + plane.p.elements[2]]);

        //drawPoint(p0);
        //drawPoint(p1);
        //drawPoint(p2);
                
        /* The original implementation from the appendix. Wasn't working
        var vn = p2.subtract(p1).cross(p1.subtract(p0));
        var A = Util.magnitude(vn);
        var nHat = vn.multiply(1/A);
        var u = p2.subtract(p1).cross(x.subtract(p1)).dot(nHat) / A;
        var v = p0.subtract(p2).cross(x.subtract(p2)).dot(nHat) / A;
        */
        
        //implementation in appendix wasn't working, so I based this off of http://www.blackpawn.com/texts/pointinpoly/
        //TODO clean this up
        var A = p0;
        var B = p1;
        var C = p2;
        
        var v0 = C.subtract(A);
        var v1 = B.subtract(A);
        var v2 = x.subtract(A);
        
        // Compute dot products
        var dot00 = v0.dot(v0);
        var dot01 = v0.dot(v1);
        var dot02 = v0.dot(v2);
        var dot11 = v1.dot(v1);
        var dot12 = v1.dot(v2);

        // Compute barycentric coordinates
        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;        
        
        if ( u >= 0 && v >= 0 && (u+v) <= 1){
            return true;
        }
        
    }
    return false;
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
    //renderer.setClearColor(0xe8e8d6 , 1); 
    renderer.setClearColor(0x000000 , 1); 
    
    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    doc.getElementById('webgl-container').appendChild(renderer.domElement);
    return renderer;
}

/** create the camera and add it to the scene */
function initCamera(){    
    var camera = new THREE.PerspectiveCamera( FIELD_OF_VIEW, ASPECT, NEAR, FAR);

    camera.position.set(0, 40, 100);

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

function drawPoint(x){
    var canvas = doc.createElement('canvas');
    var size = 100;
    canvas.width = size;
    canvas.height = size;

    var material = new THREE.SpriteMaterial( {
            //color: Math.random() * 0x808008 + 0x808080,
            color: {r: 255, g: 0, b: 0}
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 1, 1, 1 ); 
    sprite.position.set(x.elements[0], x.elements[1], x.elements[2]);
    scene.add(sprite);
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