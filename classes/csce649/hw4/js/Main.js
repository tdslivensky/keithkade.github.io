/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Bass, getUserInputs, Boiler*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand
var simTimeout;     //for starting and stopping the sim

//boilerplate
var scene, renderer, camera, light, polygon, plane;
var axes;

var bass;
var clock;

var CR = 0.5;   // coefficient of restitution. 1 is maximum bouncy
var CF = 0.5;   // coefficient of friction. 0 is no friction

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var G = new THREE.Vector3(0, -9.81, 0);  // The accel due to gravity in m/s^2 

//use grid positions for more efficient collision detections
var VOX_SIZE = 20;
var gridVoxelsHash = []; //where the vertices are on the grid
// TODO other stuff

var FACES = []; //for collision detection with barycentric coords

var planeAttr = {
    p: [-5, -20 , 0],
    r: [Math.radians(90), Math.radians(60), Math.radians(0)]
};

//ugly, but saves time garbage collecting
var state_mut;

var v1_mut = new THREE.Vector3(0,0,0); //I keep a couple mutable vectors for all calculations
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);

var p0 = new THREE.Vector3(0,0,0);
var p1 = new THREE.Vector3(0,0,0);
var p2 = new THREE.Vector3(0,0,0);
var vNormal = new THREE.Vector3(0,0,0);

var vOld = new THREE.Vector3(0,0,0);
var xOld = new THREE.Vector3(0,0,0);
var acceleration = new THREE.Vector3(0,0,0);
var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var collisionX = new THREE.Vector3(0,0,0);
var deriv;
var K1, K2, K3, K4, oldState;

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    polygon = Boiler.initPolygon(planeAttr);
    plane = Boiler.initPlane(planeAttr, polygon);
    
    //change what the camera is looking at and add our controls
    camera.position.set(15, 50, 15);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
        
    render();
    
    //if fish is false then render as cube
    var fish = false;
    bass = new Bass(scene, loadIntegrationVars, fish);
    if (!fish){
        loadIntegrationVars();
    }
};

/* load up all the mutables for integration */
function loadIntegrationVars(){
    state_mut = new Array(bass.count * 2);
    deriv = new Array(bass.count * 2);    
    K1 = new Array(bass.count * 2);
    K2 = new Array(bass.count * 2);
    K3 = new Array(bass.count * 2);
    K4 = new Array(bass.count * 2);
    oldState = new Array(bass.count * 2);
    
    for (var l = 0; l < bass.count * 2; l++){
        state_mut[l] = new THREE.Vector3(0,0,0);
        K1[l] = new THREE.Vector3(0,0,0);
        K2[l] = new THREE.Vector3(0,0,0);
        K3[l] = new THREE.Vector3(0,0,0);
        K4[l] = new THREE.Vector3(0,0,0);
        deriv[l] = new THREE.Vector3(0,0,0);
        oldState[l] = new THREE.Vector3(0,0,0);        
    }  
}

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();

    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
        
    window.clearTimeout(simTimeout);
    simulate();
}

//gets the derivative of a state. plus external forces
//returns deep copy of array
function F(state){
   
    //update our grid of positions
    for (var g = 0; g < bass.count; g++){
        gridVoxelsHash[g] = [
            Math.floor(state[g].x / VOX_SIZE),
            Math.floor(state[g].y / VOX_SIZE),
            Math.floor(state[g].z / VOX_SIZE)
        ]; 
    }
    
    //for all the particles apply gravity
    for (var i = 0; i < bass.count; i++){
        state_mut[i].copy(state[i + bass.count]);
        
        xOld.copy(state[i]);
        vOld.copy(state[i + bass.count]);

        acceleration.copy(G);                 
        state_mut[i + bass.count].copy(acceleration);
    }
    return state_mut;
}

function integrateState(state, deriv, H){
    deepCopy(oldState, state);
    stateMultScalar(deriv, H);
    addState(state, deriv);    
}

/** the main simulation loop. recursive */ 
function simulate(){ 

    //first order deriv
    deepCopy(deriv, F(bass.STATE));

    if (true){ /******************************************* euler integration */ 
        integrateState(bass.STATE, deriv, H);
    }
    else {      /******************************************* rk4 integration */ 
        deepCopy(K1, deriv);//K1 = F(Xn)

        //second order deriv
        deepCopy(deriv, K1);
        stateMultScalar(deriv, H * 0.5);
        addState(deriv, bass.STATE);
        deepCopy(K2, F(deriv)); //K2 = F(Xn + 1/2 * H * K1)

        //third order deriv
        deepCopy(deriv, K2);
        stateMultScalar(deriv, H * 0.5);
        addState(deriv, bass.STATE);
        deepCopy(K3, F(deriv)); //K3 = F(Xn + 1/2 * H * K2)

        //fourth order deriv
        deepCopy(deriv, K3);
        stateMultScalar(deriv, H);
        addState(deriv, bass.STATE);
        deepCopy(K4, F(deriv)); //K4 = F(Xn + H * K3)

        stateMultScalar(K2, 2);
        stateMultScalar(K3, 2);
        addState(K1, K2);
        addState(K1, K3);
        addState(K1, K4);
        
        //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6
        integrateState(bass.STATE, K1, H/6);
    }
    
    //COLLISION DETECTION
    for (var i = 0; i < bass.count; i++){
        //collision detection and response. if there is no collision then no change
        var collision = collisionDetectionAndResponse(oldState[i], bass.STATE[i], oldState[i + bass.count], bass.STATE[i + bass.count]);
        bass.STATE[i].copy(collision.xNew);
        bass.STATE[i + bass.count].copy(collision.vNew);
    }
    
    bass.moveParticles();
    bass.mesh.geometry.verticesNeedUpdate = true;

    var waitTime = H_MILLI - clock.getDelta(); 
    if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
        console.log("simulation getting behind and slowing down!");
    }
    simTimeout = setTimeout(simulate, waitTime);
}

function integrateVector(v1, v2, timestep){
    v1_mut.copy(v1);
    v2_mut.copy(v2);
    return v1_mut.add(v2_mut.multiplyScalar(timestep));
}

function collisionDetectionAndResponse(x1, x2, v1, v2){
    
    v1_mut.copy(x1);
    v2_mut.copy(x2);
    
    var dOld = v1_mut.sub(plane.p).dot(plane.n);
    var dNew = v2_mut.sub(plane.p).dot(plane.n);
    //check if they have the same sign
    if (dOld*dNew <= 0){
        
        var fraction = dOld / (dOld-dNew);
        collisionX.copy(integrateVector(x1, v1, fraction * H));
        
        v1_mut.copy(v1);
        vNormal.copy(plane.n).multiplyScalar(v1_mut.dot(plane.n));
        
        if (pointInPolygon(collisionX)){
            
            var response = {};
            v1_mut.copy(x2);
            v2_mut.copy(plane.n);
            response.xNew = v1_mut.sub(v2_mut.multiplyScalar(dNew * (1 + CR))).clone();

            v1_mut.copy(v1);
            var vTan = v1_mut.sub(vNormal);

            response.vNew = vNormal.multiplyScalar(-1 * CR).add(vTan.multiplyScalar(1 - CF)).clone();

            return response;
        }
    }
    
    return {xNew: x2, vNew: v2};
}

function pointInPolygon(x){

    var v0, v1, v2, dot00, dot01, dot02, dot11, dot12, denom, u, v;
    for (var i=0; i < polygon.geometry.faces.length; i++){
        
        //implementation in appendix wasn't working, so I based this off of http://www.blackpawn.com/texts/pointinpoly/
        p0.copy(FACES[i][0]);
        p1.copy(FACES[i][1]);
        p2.copy(FACES[i][2]);
        
        v0 = p2.sub(p0);
        v1 = p1.sub(p0);
        v1_mut.copy(x);
        v2 = v1_mut.sub(p0);
        
        // Compute dot products
        dot00 = v0.dot(v0);
        dot01 = v0.dot(v1);
        dot02 = v0.dot(v2);
        dot11 = v1.dot(v1);
        dot12 = v1.dot(v2);

        // Compute barycentric coordinates
        denom = 1 / (dot00 * dot11 - dot01 * dot01);
        u = (dot11 * dot02 - dot01 * dot12) * denom;
        v = (dot00 * dot12 - dot01 * dot02) * denom;        
        
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

function addState(state1, state2){
    for (var i = 0; i < state1.length; i++){
        state1[i].add(state2[i]);
    }
}

function stateMultScalar(state, scalar){
    for (var i = 0; i < state.length; i++){
        state[i].multiplyScalar(scalar);
    }
}

function deepCopy(state1, state2){
    for (var i = 0; i < state1.length; i++){
        state1[i].copy(state2[i]);
    }          
}
