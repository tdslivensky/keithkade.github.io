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
var K_A = 15;       //collision avoidance
var K_V = 1;        //velocity matching
var K_C = 1;        //centering

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
    
    zooka = new Beezooka(scene, 'gaussian', 50);
    zooka.fire({v: initialV});   
    
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
    
    window.clearTimeout(simTimeout);
    simulate();
    render();
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
            if (dist < 40){           
                v2_mut.normalize().multiplyScalar(-1 * K_A / dist);
                acceleration.add(v2_mut);
            }
            
            //Velocity matching
            if (dist < 10) {
                v1_mut.copy(zooka.getV(j));  //v_k
                acceleration.add(v1_mut.sub(zooka.getV(i)).multiplyScalar(K_V));
            }
            
            //centering. v3_mut is x_ij
            if (dist > 40) {
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
