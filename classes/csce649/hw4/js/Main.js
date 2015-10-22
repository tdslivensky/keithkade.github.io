/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Bass, getUserInputs, Boiler*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand
var simTimeout;     //for starting and stopping the sim

//boilerplate
var scene, renderer, camera, light;
var axes;

var bass;
var clock;

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var G = new THREE.Vector3(0, -9.81, 0);  // The accel due to gravity in m/s^2 

//use grid positions for more efficient collision detections
var VOX_SIZE = 20;
var gridVoxelsHash = []; //where the vertices are on the grid
// TODO other stuff

//ugly, but saves time garbage collecting
var state_mut;

var v1_mut = new THREE.Vector3(0,0,0); //I keep a couple mutable vectors for all calculations
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);

var vOld = new THREE.Vector3(0,0,0);
var xOld = new THREE.Vector3(0,0,0);
var acceleration = new THREE.Vector3(0,0,0);
var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var deriv;
var K1, K2, K3, K4;

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    
    //change what the camera is looking at and add our controls
    camera.position.set(15, 50, 15);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
        
    render();
    bass = new Bass(scene, loadIntegrationVars);
};

/* load up all the mutables for integration */
function loadIntegrationVars(){
    state_mut = new Array(bass.count * 2);
    deriv = new Array(bass.count * 2);    
    K1 = new Array(bass.count * 2);
    K2 = new Array(bass.count * 2);
    K3 = new Array(bass.count * 2);
    K4 = new Array(bass.count * 2);
    
    for (var l = 0; l < bass.count * 2; l++){
        state_mut[l] = new THREE.Vector3(0,0,0);
        K1[l] = new THREE.Vector3(0,0,0);
        K2[l] = new THREE.Vector3(0,0,0);
        K3[l] = new THREE.Vector3(0,0,0);
        K4[l] = new THREE.Vector3(0,0,0);
        deriv[l] = new THREE.Vector3(0,0,0);
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
        
        //COLLISION DETECTION
        
        state_mut[i + bass.count].copy(acceleration);
    }
    return state_mut;
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

/** the main simulation loop. recursive */ 
function simulate(){ 

    //first order deriv
    deepCopy(deriv, F(bass.STATE));

    if (false){ /******************************************* euler integration */ 
        stateMultScalar(deriv, H);
        addState(bass.STATE, deriv);
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
        stateMultScalar(K1, H/6);

        addState(bass.STATE, K1); //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6
    }
    
    bass.moveParticles();
    bass.mesh.geometry.verticesNeedUpdate = true;

    var waitTime = H_MILLI - clock.getDelta(); 
    if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
        console.log("simulation getting behind and slowing down!");
    }
    simTimeout = setTimeout(simulate, waitTime);
}

/** rendering loop */
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //redraw whenever the browser refreshes
}
