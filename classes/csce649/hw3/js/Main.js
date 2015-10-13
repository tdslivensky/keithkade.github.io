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
var zookaCylinder;

var zooka;
var clock;
var repulsors = []; //smoke clouds
var enemies = []; //bee-eaters
var target;

var ENEMY_SIZE = 30;
var LOOK_AHEAD_TIME = 3; //seconds
var TARGET_FORCE = 30000; //bigger = slower

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
var K_C = 0.01;        //centering

//ugly, but saves time garbage collecting
var v1_mut = new THREE.Vector3(0,0,0); //I keep a couple mutable vectors for all calculations
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);
var v5_mut = new THREE.Vector3(0,0,0);
var vOld = new THREE.Vector3(0,0,0);
var xOld = new THREE.Vector3(0,0,0);
var acceleration = new THREE.Vector3(0,0,0);
var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var dist = 0;

var simTimeout;
var state_mut;

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    zookaCylinder = Boiler.initZookaCylinder();
    
    //change what the camera is looking at and add our controls
    camera.position.set(100, 100, 800);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    addRepulsor(new THREE.Vector3(50, 12, 0));
    addRepulsor(new THREE.Vector3(60, 0, 12));

    addEnemy(new THREE.Vector3(100, 100, 0));
    
    setTarget(new THREE.Vector3(300, 100, 0));
    
    initMotion();
};

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    getUserInputs();
    if (zooka){
        zooka.delete(scene);
    }
    
    var ammo = 45;
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
        
        xOld.copy(state[i]);
        vOld.copy(state[i + zooka.max]);

        v1_mut.copy(G);

        acceleration.copy(G); 
        acceleration.add(getRepulsorForces(xOld));
        acceleration.add(getSteeringForces(xOld, vOld));

        if (i % 20 !== 0){ //every 20th bee is a seeker bee who doesn't follow flocking rules
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
                    //we care even more about the leaders bees
                    if (j % 20 === 0){
                        acceleration.add(v1_mut.multiplyScalar(2));
                    }
                }

                //centering. v3_mut is x_ij
                if (dist > 40) {
                    acceleration.add(v3_mut.multiplyScalar(K_C));
                    if (j % 20 === 0){
                        acceleration.add(v3_mut.multiplyScalar(2));
                    }
                }
            }
        }
        else {
            acceleration.add(getTargetForces(xOld, vOld));
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
    Boiler.drawRepel(x);
    repulsors.push(x);
}

function addEnemy(x){
    Boiler.drawEater(x);
    enemies.push(x);
}

function setTarget(x){
    Boiler.drawFlower(x);
    target = x;
}

function getRepulsorForces(x){
    var fTotal = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i< repulsors.length; i++){
        var r = repulsors[i];
        dist = x.distanceTo(r);
        
        if (dist < 50){ 
            var f = 1500 / (dist*dist);  //force inversely proportional to distance
            var v = new THREE.Vector3(x.x - r.x, x.y - r.y, x.z - r.z).normalize(); //repulse
            fTotal = fTotal.add(v.multiplyScalar(f)); 
        }
    }
    return fTotal;
}

function getSteeringForces(x, v){
    var fTotal = new THREE.Vector3(0, 0, 0);
    v2_mut.copy(x);
    v3_mut.copy(x);
    v4_mut.copy(v);

    //approximation based on sphere around enemy
    for (var i = 0; i< enemies.length; i++){ 
        
        var c = enemies[i];
        v2_mut.copy(x);
        v3_mut.copy(enemies[i]);
        v4_mut.copy(v);
        
        //vHat 
        v4_mut.normalize();
        
        //x_is
        v3_mut.sub(x);
        
        //sClose
        var sClose = v3_mut.dot(v4_mut);
        
        //how far we look ahead
        var dConcern = v.length() * LOOK_AHEAD_TIME; 
            
        if (sClose < dConcern && sClose > 0){ //maybe collision
            //xClose
            v2_mut.add(v4_mut.multiplyScalar(sClose));
            
            var d = v2_mut.sub(c).length();  //d = ∥xclose −cs∥
            
            if (d < ENEMY_SIZE){  //AVOID IT
                
                //vTan is v2_mut at this point
                    
                //vTanHat 
                v2_mut.normalize();
                
                v3_mut.copy(v2_mut);
                
                v3_mut.multiplyScalar(ENEMY_SIZE).add(c); //xt = cs + Rvˆ⊥

                var dt = v3_mut.sub(x).length();
                
                var vt = v.dot(v3_mut) / dt; //vt = vi ·(xt −xi)/dt
                
                var tt = dt/vt;
                
                v4_mut.copy(v);

                var deltaV = v4_mut.normalize().cross(v3_mut).length() / tt;          //∆vs = ∥vˆi ×(xt −xi)∥/tt
                
                var accel = 2 * deltaV / tt;            //as = 2∆vs/t
                
                //neededAccel
                v2_mut.multiplyScalar(accel); //a+op = asvˆ⊥
                
                fTotal.add(v2_mut);
            }
        }        
    }

    
    return fTotal;
}

//seeker bees are attracted to the target
function getTargetForces(x, v){
    var fTotal = new THREE.Vector3(0, 0, 0); 
    dist = x.distanceTo(target);
    var f = (dist*dist) / TARGET_FORCE; //force should be proportional to distance 
    var vectorBetween = new THREE.Vector3(target.x - x.x, target.y - x.y, target.z - x.z);
    var a = vectorBetween.clone().normalize(); //attract

    //accel towards target
    fTotal.add(a.multiplyScalar(f));

    /*
        I tried a couple strategies for getting a homing missile effect as opposed to an orbit
        I do this by slowing the bees down as I think they get closer to the target
        Kinda works
    */
    if (dist > 10){
        var ang = Math.degrees(v.angleTo(vectorBetween));
        v2_mut.copy(v);

        //slow down based on if accell is away from velocity
        fTotal.add(v2_mut.multiplyScalar(-2 * ang/180));

        //slow down as distance decreases
        fTotal.add(v2_mut.multiplyScalar(-20 / dist));

        var forceFactor = f;
        fTotal.add(a.multiplyScalar(forceFactor));
    }
    return fTotal;
}

function moveZooka(){
    zookaCylinder.position.x = initialX.x - 100; //shift permanently by half the zooka length
    zookaCylinder.position.y = initialX.y;
    zookaCylinder.position.z = initialX.z;
}