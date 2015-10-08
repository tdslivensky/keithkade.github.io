/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Beezooka, getUserInputs, Boiler*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand

var scene;
var renderer;
var camera;
var light;
var axes;

var zooka;
var clock;
var repulsors = [];

//Physics variables
var G = new THREE.Vector3(0, -9.81, 0);  // The accel due to gravity in m/s^2 

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var initialX = new THREE.Vector3(0,0,0);  // Position
var initialV = new THREE.Vector3(0,0,0);  // Velocity

//flocking tuning constants
var K_A = 0.5;       //collision avoidance
var K_V = 0.5;        //velocity matching
var K_C = 0.5;        //centering

//ugly, but saves time garbage collecting
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

var simTimeout;
var state_mut;

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    addRepulsor(new THREE.Vector3(20, 0, 0));

    initMotion();
};

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();
    if (zooka){
        zooka.delete(scene);
    }
    
    var ammo = 50;
    zooka = new Beezooka(scene, 'gaussian', ammo);
    state_mut = new Array(ammo * 2);
    for (var i = 0; i < ammo * 2; i++){
        state_mut[i] = new THREE.Vector3(0,0,0);
    }

    zooka.fire({v: initialV});   
    
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    
    window.clearTimeout(simTimeout);
    simulate();
    render();
}

//gets the derivative of a state. plus external forces
function F(state){
    //for all the particles apply physics
    for (var i=0; i<zooka.max; i++){
        state_mut[i].copy(state[i + zooka.max]);
        
        xOld.copy(zooka.STATE[i]);
        vOld.copy(zooka.STATE[i + zooka.max]);

        v1_mut.copy(G);

        acceleration.copy(G); 
        acceleration.add(getRepulsorForces(xOld));

        for (var j=0; j<zooka.max; j++){
            if (i==j){
                continue;
            }
            
            v1_mut.copy(zooka.STATE[i]);    //x_i
            v2_mut.copy(zooka.STATE[j]);    //x_j
            dist = v1_mut.distanceTo(v2_mut);
            v2_mut.sub(v1_mut);         
            v3_mut.copy(v2_mut);            //x_ij
            
            //collision avoidance
            if (dist < 40){           
                v2_mut.normalize().multiplyScalar(-1 * K_A / dist);
                acceleration.add(v2_mut);
            }
            
            //Velocity matching
            if (dist < 10) {
                v1_mut.copy(zooka.STATE[j + zooka.max]);  //v_k
                acceleration.add(v1_mut.sub(zooka.STATE[i + zooka.max]).multiplyScalar(K_V));
            }
            
            //centering. v3_mut is x_ij
            if (dist > 40) {
                acceleration.add(v3_mut.multiplyScalar(K_C));     
            }
        }
        
        state_mut[i + zooka.max].copy(acceleration);
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

/** the main simulation loop. recursive */ 
function simulate(){ 
    var timestep = H;

    //euler integration
    var deriv = F(zooka.STATE);
    stateMultScalar(deriv, H);
    addState(zooka.STATE, deriv);
    
    //zooka.STATE.add(F(zooka.STATE).multiply(h));
    
    zooka.moveParticles();
    zooka.points.geometry.verticesNeedUpdate = true;

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


/************* repulsor physics *************/

function addRepulsor(x){
    Boiler.drawPoint(x);
    repulsors.push(x);
}

function getRepulsorForces(x){
    var fTotal = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i< repulsors.length; i++){
        var r = repulsors[i];
        dist = x.distanceTo(r);
        
        if (dist < 50){ 
            var f = 1000 / (dist*dist);  
            var v = new THREE.Vector3(x.x - r.x, x.y - r.y, x.z - r.z).normalize();
            fTotal = fTotal.add(v.multiplyScalar(f)); // negative makes it attract
        }
    }
    return fTotal;
}
