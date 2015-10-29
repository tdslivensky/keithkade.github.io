/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Bass, getUserInputs, Boiler*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand
var simTimeout;     //for starting and stopping the sim

//boilerplate
var scene, renderer, camera, light, polygon;
var axes;

var bass;
//if fish is false then render as cube
var fish = true;
var clock;

var CR = 0.5;   // coefficient of restitution. 1 is maximum bouncy
var CF = 0.5;   // coefficient of friction. 0 is no friction

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var G = new THREE.Vector3(0, -9.81, 0);  // The accel due to gravity in m/s^2 

var collidables = [];

var polyAttr = {
    p: [-5, -20 , 0],
    r: [Math.radians(90), Math.radians(60), Math.radians(0)]
};

//ugly, but saves time garbage collecting
var state_mut;

var v1_mut = new THREE.Vector3(0,0,0); //I keep a couple mutable vectors for all calculations
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);

var p0_mut = new THREE.Vector3(0,0,0);
var p1_mut = new THREE.Vector3(0,0,0);
var p2_mut = new THREE.Vector3(0,0,0);
var vNormal = new THREE.Vector3(0,0,0);
var plane_mut = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

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
    polygon = Boiler.initPolygon(polyAttr);
    
    collidables.push(polygon);
    
    //change what the camera is looking at and add our controls
    camera.position.set(15, 50, 15);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
        
    render();
    
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
    
    //TODO Edge-Edge Collision
    for (var j=0; j<bass.edges; j++){
        var edge = bass.edges;
        var edgeResponse = edgeEdgeResponse(edge);
        if(edgeResponse){
            bass.STATE[edge[0]].copy(edgeResponse[0].xNew);
            bass.STATE[edge[0] + bass.count].copy(edgeResponse[0].vNew);
            bass.STATE[edge[1]].copy(edgeResponse[1].xNew);
            bass.STATE[edge[1] + bass.count].copy(edgeResponse[1].vNew);            
        }
    }
    
    
    //Vertex Face Collision
    for (var i = 0; i < bass.count; i++){
        var vertexResponse = vertexFaceResponse(oldState[i], bass.STATE[i], oldState[i + bass.count], bass.STATE[i + bass.count]);
        if (vertexResponse){
            bass.STATE[i].copy(vertexResponse.xNew);
            bass.STATE[i + bass.count].copy(vertexResponse.vNew);
        }
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

//find results of any vertex face collisions
function vertexFaceResponse(x1, x2, v1, v2){
        
    //loop through all collidable objects
    for (var p=0; p < collidables.length; p++){
        var poly = collidables[p];
        
        //all faces on the object
        for (var i=0; i < poly.geometry.faces.length; i++){
            var face = poly.geometry.faces[i];

            v1_mut.copy(x1);
            v2_mut.copy(x2);

            p0_mut.set(poly.geometry.vertices[face.a].x + poly.position.x, 
                   poly.geometry.vertices[face.a].y + poly.position.y,
                   poly.geometry.vertices[face.a].z + poly.position.z);
            p1_mut.set(poly.geometry.vertices[face.b].x + poly.position.x, 
                   poly.geometry.vertices[face.b].y + poly.position.y, 
                   poly.geometry.vertices[face.b].z + poly.position.z);
            p2_mut.set(poly.geometry.vertices[face.c].x + poly.position.x,
                   poly.geometry.vertices[face.c].y + poly.position.y, 
                   poly.geometry.vertices[face.c].z + poly.position.z);

            /* THIS MIGHT HELP?
            v3_mut.set((p0_mut.x + p1_mut.x + p2_mut.x)/3,
                       (p0_mut.y + p1_mut.y + p2_mut.y)/3,
                       (p0_mut.z + p1_mut.z + p2_mut.z)/3);
            
            //if the point is really far from the average of the face don't test further (maybe should check both)
            if (v3_mut.distanceTo(xOld) > 20){
              continue;
            }
            */
            
            plane_mut.setFromCoplanarPoints(p0_mut, p1_mut, p2_mut);

            var dOld = plane_mut.distanceToPoint(v1_mut);
            var dNew = plane_mut.distanceToPoint(v2_mut);

            //check if they have the same sign
            if (dOld*dNew <= 0){            

                var fraction = dOld / (dOld-dNew);
                collisionX.copy(integrateVector(x1, v1, fraction * H));

                v1_mut.copy(v1);
                vNormal.copy(plane_mut.normal).multiplyScalar(v1_mut.dot(plane_mut.normal));

                if (pointInFace(collisionX, face, poly, p0_mut, p1_mut, p2_mut)){

                    var response = {};
                    v1_mut.copy(x2);
                    v2_mut.copy(plane_mut.normal);
                    response.xNew = v1_mut.sub(v2_mut.multiplyScalar(dNew * (1 + CR))).clone();

                    v1_mut.copy(v1);
                    var vTan = v1_mut.sub(vNormal);

                    response.vNew = vNormal.multiplyScalar(-1 * CR).add(vTan.multiplyScalar(1 - CF)).clone();

                    return response;
                }
            }
        }
    }
    return false;
}

function pointInFace(x, face, poly, p0, p1, p2){
    //implementation in appendix wasn't working, so I based this off of http://www.blackpawn.com/texts/pointinpoly/
    var v0, v1, v2, dot00, dot01, dot02, dot11, dot12, denom, u, v;

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

//find results of any edge edge collisions
function edgeEdgeResponse(tuple){
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
