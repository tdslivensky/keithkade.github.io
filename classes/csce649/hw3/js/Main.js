/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Beezooka*/ 

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
if (window.innerWidth < 700){ //so it can look ok on mobile
    panelWidth = 0;
}
var SCENE_WIDTH = window.innerWidth - panelWidth; //430 is width of options panel
var SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 

var FIELD_OF_VIEW = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var planeAttr = {
    p: [20, 0 , 0],
    r: [Math.radians(90), Math.radians(70), Math.radians(0)]
};

var scene = new THREE.Scene();
var renderer = initRenderer();
var camera = initCamera();
var light = initLight();
var axes = initAxes();
var zooka;
var clock;
var isSimulating;   //is the simulation currently running?
var repulsors = [];
var collisionCount = 0;
var polygonThere = true; //whether the polygon has been broken

//Physics variables
var G = new THREE.Vector3(0, -9.81, 0);  // The accel due to gravity in m/s^2 
var minRestV = 0.7;          // minimum velocity to declare at rest

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var initialX = new THREE.Vector3(0,0,0);  // Position
var initialV = new THREE.Vector3(0,0,0);  // Velocity
var D;              // Air resitence
var CR;             // coefficient of restitution. 1 is maximum bouncy
var CF;             // coefficient of friction. 0 is no friction
var K_A = 0.9;        //flocking tuning constants
var K_V = 0.9;
var K_C = 0.9;


//to keep from spending time garbage collecting
var v1_mut = new THREE.Vector3(0,0,0); //I keep a couple mutable vectors for all calculations
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var dOld = 0;
var dNew = 0;
var fraction = 0;
var particleFraction = 0;
var collisionX = new THREE.Vector3(0,0,0);
var vOld = new THREE.Vector3(0,0,0);
var xOld = new THREE.Vector3(0,0,0);
var acceleration = new THREE.Vector3(0,0,0);
var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var vNormal = new THREE.Vector3(0,0,0);
var p0 = new THREE.Vector3(0,0,0);
var p1 = new THREE.Vector3(0,0,0);
var p2 = new THREE.Vector3(0,0,0);
var dist = 0;

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();
    if (zooka){
        zooka.delete(scene);
    }
    
    zooka = new Beezooka(scene, 'gaussian', 40);
    addRepulsor(new THREE.Vector3(20, 0, 0));
    //addRepulsor(new THREE.Vector3(-9, -12, -18));
    //addRepulsor(new THREE.Vector3(-4, -12, -13));
    //addRepulsor(new THREE.Vector3(-4, -12, -18));
    //addRepulsor(new THREE.Vector3(-9, -12, -23));
    //addRepulsor(new THREE.Vector3(-4, -12, -23));
    //addRepulsor(new THREE.Vector3(-9, -12, -28));
    //addRepulsor(new THREE.Vector3(-4, -12, -28));
    
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    isSimulating = true;
    zooka.fire({v: initialV});   
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
    return polygon;
}


/** Euler integration */
function integrate(v1, v2, timestep){
    v1_mut.copy(v1);
    v2_mut.copy(v2);
    return v1_mut.add(v2_mut.multiplyScalar(timestep));
}

/** the main simulation loop. recursive */ 
function simulate(){ 
    var timestep = H;

    //for all the particles apply physics
    for (var i=0; i<zooka.max; i++){
        if (!zooka.isVisible(i)){
            continue;
        }
        vOld.copy(zooka.getV(i));
        xOld.copy(zooka.getX(i));

        v1_mut.copy(G);
        v1_mut.sub(v2_mut.copy(vOld).multiplyScalar(D));

        acceleration.copy(v1_mut); 
        acceleration.add(getRepulsorForces(xOld));

        for (var j=0; j<zooka.max; j++){
            if (!zooka.isVisible(i) || i==j){
                continue;
            }
            
            //collision avoidance
            v1_mut.copy(zooka.getX(i));   //x_i
            v2_mut.copy(zooka.getX(j));   //x_j
            dist = v1_mut.distanceTo(v2_mut);
            v2_mut.sub(v1_mut);         
            v3_mut.copy(v2_mut);        //x_ij
            
            //collision avoidance
            if (dist < 20){           
                v2_mut.normalize().multiplyScalar(-1 * K_A / dist);
                acceleration.add(v2_mut);
            }
            
            //Velocity matching
            if (dist < 10) {
                v1_mut.copy(zooka.getV(j));  //v_k
                acceleration.add(v1_mut.sub(zooka.getV(i)).multiplyScalar(K_V));
            }
            
            //centering. v3_mut is x_ij
            if (dist > 25) {
                acceleration.add(v3_mut.multiplyScalar(K_C));     
            }
        }

        vNew.copy(integrate(vOld, acceleration, timestep));
        xNew.copy(integrate(xOld, vOld, timestep));        
        
        //collision detection and response. if there is no collision then no change
        //var collision = collisionDetectionAndResponse(xOld, xNew, vOld, vNew);
        //xNew.copy(collision.xNew);
        //vNew.copy(collision.vNew);

        zooka.moveParticle(i, xNew);
        zooka.setV(i, vNew);
    }
    
    zooka.points.geometry.verticesNeedUpdate = true;

    var waitTime = H_MILLI - clock.getDelta(); 
    if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
        console.log("simulation getting behind and slowing down!");
    }
    setTimeout(simulate, waitTime);
}

/** rendering loop */
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //redraw whenever the browser refreshes
}


/************* repulsor *************/

function addRepulsor(x){
    drawPoint(x);
    repulsors.push(x);
}

function getRepulsorForces(x){
    var fTotal = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i< repulsors.length; i++){
        var r = repulsors[i];
        dist = x.distanceTo(r);
        
        //if (dist < 500){ 
            //arbitrary. fiddle
            var f = 1000 / (dist*dist);  
            var v = new THREE.Vector3(x.x - r.x, x.y - r.y, x.z - r.z).normalize();
            fTotal = fTotal.add(v.multiplyScalar(f)); // negative makes it attract
        //}
    }
    return fTotal;
}

/************* THREE.js boilerplate *************/

/** create the renderer and add it to the scene */
function initRenderer(){
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xeeeeee , 1); 
    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    renderer.sortObjects = false; //helps. doesn't fix transparency issues fully though
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
    axes.add(initLabel('X','#ff0000', [25, 0, 0]));
    axes.add(initLabel('Y','#00ff00', [0, 25, 0]));
    axes.add(initLabel('Z','#0000ff', [0, 0, 25]));
    
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
            color: {r: 255, g: 0, b: 0}
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 1, 1, 1 ); 
    sprite.position.set(x.x, x.y, x.z);
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
    
    G.x = parseFloat(doc.getElementById("g.x").value);
    G.y = parseFloat(doc.getElementById("g.y").value);
    G.z = parseFloat(doc.getElementById("g.z").value);
    
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
    doc.getElementById("g.y").value = -1;
    doc.getElementById("g.z").value = 0;
    doc.getElementById("g.x-slider").value = 0;
    doc.getElementById("g.y-slider").value = -1;
    doc.getElementById("g.z-slider").value = 0;    

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

    doc.getElementById("H").value = Util.getRandom(0.016, 0.1);    
    H_MILLI = H * 1000;    
    
    doc.getElementById("D").value = Util.getRandom(0, 1);  
    doc.getElementById("CR").value = Util.getRandom(0, 1);    
    doc.getElementById("CF").value = Util.getRandom(0, 1);
    getUserInputs();
}