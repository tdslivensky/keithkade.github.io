/*jshint -W004*/
/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, Springy, getUserInputs, Boiler*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand
var simTimeout;     //for starting and stopping the sim

//boilerplate
var scene, renderer, camera, light;
var axes;

var springy;
//if fish is false then render as cube
var fish = false;
var clock;
var vertArr; //shorthand reference to the vertice array of the bass

var CR = 0.5;   // coefficient of restitution. 1 is maximum bouncy
var CF = 0.5;   // coefficient of friction. 0 is no friction

var K = 50;
//var KTOR = 10;
var D = 1;
//var DTOR = 1; 

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var G = new THREE.Vector3(0, 0, 0);  // The accel due to gravity in m/s^2 
var useRK4 = true;

var collidables = [];

var cubeAttr1 = {
    p: [-7, -30 , 0],
    r: [Math.radians(10), Math.radians(30), Math.radians(30)],
    scale: 20
};

var cubeAttr2 = {
    p: [50, -90 , 0],
    r: [Math.radians(0), Math.radians(0), Math.radians(30)],
    scale: 50
};

//ugly, but saves time garbage collecting
var state_mut;

var v0_mut = new THREE.Vector3(0,0,0); //I keep mutable vectors for all calculations
var v1_mut = new THREE.Vector3(0,0,0); 
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);
var v5_mut = new THREE.Vector3(0,0,0);
var v6_mut = new THREE.Vector3(0,0,0);
var v7_mut = new THREE.Vector3(0,0,0);
var v8_mut = new THREE.Vector3(0,0,0);
var v9_mut = new THREE.Vector3(0,0,0);
var v10_mut = new THREE.Vector3(0,0,0);
var v11_mut = new THREE.Vector3(0,0,0);
var v12_mut = new THREE.Vector3(0,0,0);

var fr0_mut = new THREE.Vector3(0,0,0); //I keep mutable vectors for all calculations
var fr1_mut = new THREE.Vector3(0,0,0); 
var fr2_mut = new THREE.Vector3(0,0,0);
var fr3_mut = new THREE.Vector3(0,0,0);

var r0_mut = new THREE.Vector3(0,0,0); //I keep mutable vectors for all calculations
var r1_mut = new THREE.Vector3(0,0,0); 
var r2_mut = new THREE.Vector3(0,0,0);
var r3_mut = new THREE.Vector3(0,0,0);

var torque = new THREE.Vector3(0,0,0);
var p0_mut = new THREE.Vector3(0,0,0);
var p1_mut = new THREE.Vector3(0,0,0);
var p2_mut = new THREE.Vector3(0,0,0);
var vNormal = new THREE.Vector3(0,0,0);
var plane_mut = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

var f1_mut = new THREE.Face3();
var f2_mut = new THREE.Face3();

var vOld = new THREE.Vector3(0,0,0);
var xOld = new THREE.Vector3(0,0,0);
var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var collisionX = new THREE.Vector3(0,0,0);
var deriv;
var K1, K2, K3, K4, oldState;

//edge collisions
var q1 = new THREE.Vector3(0,0,0);
var q2 = new THREE.Vector3(0,0,0);
var pa = new THREE.Vector3(0,0,0);
var qa = new THREE.Vector3(0,0,0);

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    var polygon1 = Boiler.initCube(cubeAttr1);
    collidables.push(polygon1);
    
    var polygon2 = Boiler.initCube(cubeAttr2);
    collidables.push(polygon2);
    
    //add edges to the object    
    for (var p=0; p < collidables.length; p++){
        var mesh = collidables[p];
        Util.addStruts(mesh);
    }
    
    //change what the camera is looking at and add our controls
    camera.position.set(0, 0, 45);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
        
    render();
    
    springy = new Springy(scene, loadIntegrationVars, fish);

    if (!fish){
        loadIntegrationVars();
    }
};

/* load up all the mutables for integration */
function loadIntegrationVars(){
    vertArr = springy.mesh.geometry.vertices; //shorthand
    
    state_mut = new Array(springy.count * 2);
    deriv = new Array(springy.count * 2);    
    K1 = new Array(springy.count * 2);
    K2 = new Array(springy.count * 2);
    K3 = new Array(springy.count * 2);
    K4 = new Array(springy.count * 2);
    oldState = new Array(springy.count * 2);
    
    for (var l = 0; l < springy.count * 2; l++){
        state_mut[l] = new THREE.Vector3(0,0,0);
        K1[l] = new THREE.Vector3(0,0,0);
        K2[l] = new THREE.Vector3(0,0,0);
        K3[l] = new THREE.Vector3(0,0,0);
        K4[l] = new THREE.Vector3(0,0,0);
        deriv[l] = new THREE.Vector3(0,0,0);
        oldState[l] = new THREE.Vector3(0,0,0);        
    }  
}

/** for demoing rk4 vs euler */
function nudge(){
    springy.STATE[3].x += 5;
    springy.mesh.geometry.computeFaceNormals();   
}

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){
    //nudge();
    
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
    
    //gravity
    for (var n = 0; n < springy.count; n++){
        state_mut[n].copy(state[n + springy.count]);
        
        xOld.copy(state[n]);
        vOld.copy(state[n + springy.count]);

        state_mut[n + springy.count].copy(G); //accel due to gravity
    }
    
    //edge springs
    for (var k = 0; k < springy.mesh.struts.length; k++){
        var strut = springy.mesh.struts[k];
        var i = strut.vertices[0];
        var j = strut.vertices[1];
        v1_mut.copy(state[i]); //x_i
        v2_mut.copy(state[j]); //x_j
        v3_mut.copy(v2_mut).sub(v1_mut); //x_ij
        var l = v3_mut.length();
        v4_mut.copy(v3_mut).normalize(); //x_ij_hat
        
        v5_mut.copy(v4_mut).multiplyScalar( (l - strut.rlength) * strut.k); //fs
        
        v8_mut.copy(v5_mut).multiplyScalar(1/vertArr[i].mass); //f_s_i / mass
        state_mut[i + springy.count].add(v8_mut); 
        
        v8_mut.copy(v5_mut).multiplyScalar(1/vertArr[j].mass); //f_s_j / mass       
        state_mut[j + springy.count].sub(v8_mut);
        
        v6_mut.copy(state[j + springy.count]); // v_j
        v6_mut.sub(state[i + springy.count]); //v_j - v_i
        v7_mut.copy(v4_mut).multiplyScalar(v6_mut.dot(v4_mut) * strut.d);
        
        //force to accel
        v8_mut.copy(v7_mut).multiplyScalar(1/vertArr[i].mass); //f_s_i / mass
        state_mut[i + springy.count].add(v8_mut); 
        
        v8_mut.copy(v7_mut).multiplyScalar(1/vertArr[j].mass); //f_s_j / mass
        state_mut[j + springy.count].sub(v8_mut);
    }
    
    //torsional springs. not working
    /*
    for (var k = 0; k < springy.mesh.struts.length; k++){
        var strut = springy.mesh.struts[k];
        
        if (strut.faces.length == 1) continue; //edges
        
        f1_mut.copy(springy.mesh.geometry.faces[strut.faces[0]]); //left triangle
        f2_mut.copy(springy.mesh.geometry.faces[strut.faces[1]]); //right triangle
        
        v0_mut.copy(state[strut.vertices[0]]); //x0
        v1_mut.copy(state[strut.vertices[1]]); //x1
        var x2_index = getOtherVertex(f1_mut, strut.vertices[0], strut.vertices[1]);
        var x3_index = getOtherVertex(f2_mut, strut.vertices[0], strut.vertices[1]);
        v2_mut.copy(state[x2_index]); //x2
        v3_mut.copy(state[x3_index]); //x3
        
        v4_mut.copy(v0_mut).sub(v1_mut); //x_01
        v5_mut.copy(v4_mut).normalize(); //x_01_hat = h_hat
        
        v6_mut.copy(v0_mut).sub(v2_mut); //x_02
        v7_mut.copy(v0_mut).sub(v3_mut); //x_03

        v8_mut.copy(v5_mut).multiplyScalar(v6_mut.dot(v5_mut)); // h_hat * (x_02 . h_hat)
        v9_mut.copy(v5_mut).multiplyScalar(v7_mut.dot(v5_mut)); // h_hat * (x_03 . h_hat)
        
        v10_mut.copy(v6_mut).sub(v8_mut); // r_l
        v11_mut.copy(v7_mut).sub(v9_mut); // r_r
        
        //FIXME
        //f1_mut= f1_mut.clone();
        //f1_mut.normal.multiplyScalar(-1);
        
        var theta = f1_mut.normal.angleTo(f2_mut.normal);
        var otherTheta = Math.atan2(f1_mut.normal.clone().cross(f2_mut.normal).dot(v5_mut) , f1_mut.normal.dot(f2_mut.normal));
        
        var thetaDotL = state[x2_index + springy.count].dot(f1_mut.normal) / v10_mut.length();
        var thetaDotR = state[x3_index + springy.count].dot(f2_mut.normal) / v11_mut.length();

        //numerical error can cause there to be a difference when there shouldn't be
        torque.copy(v5_mut).multiplyScalar(strut.ktor * (theta - strut.rtheta) - strut.dtor * (thetaDotL + thetaDotR));
        //tolerance
        //if (torque.x < 0.000000001) torque.x = 0;
        //if (torque.y < 0.000000001) torque.y = 0;
        //if (torque.z < 0.000000001) torque.z = 0;
        
        fr2_mut.copy(f1_mut.normal).multiplyScalar(torque.dot(v5_mut) / v10_mut.length()); //f2
        fr3_mut.copy(f2_mut.normal).multiplyScalar(torque.dot(v5_mut) / v11_mut.length()); //f3
        
        var d02 = v6_mut.dot(v5_mut);
        var d03 = v7_mut.dot(v5_mut);
        
        v12_mut.copy(fr3_mut);
        fr1_mut.copy(fr2_mut).multiplyScalar(d02).add(v12_mut.multiplyScalar(d03)).multiplyScalar(-1 / v4_mut.length());
        
        fr0_mut.copy(fr1_mut).add(fr2_mut).add(fr3_mut).multiplyScalar(-1);
        
        //add forces!
        state_mut[strut.vertices[0] + springy.count].add(fr0_mut.multiplyScalar(1/vertArr[strut.vertices[0]].mass));
        state_mut[strut.vertices[1] + springy.count].add(fr1_mut.multiplyScalar(1/vertArr[strut.vertices[1]].mass));
        state_mut[x2_index + springy.count].add(fr2_mut.multiplyScalar(1/vertArr[x2_index].mass));
        state_mut[x3_index + springy.count].add(fr3_mut.multiplyScalar(1/vertArr[x3_index].mass));
    }
    */
    
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
    deepCopy(deriv, F(springy.STATE));

    if (useRK4) {       /******************************************* rk4 integration */ 
        deepCopy(K1, deriv);//K1 = F(Xn)

        //second order deriv
        deepCopy(deriv, K1);
        stateMultScalar(deriv, H * 0.5);
        addState(deriv, springy.STATE);
        deepCopy(K2, F(deriv)); //K2 = F(Xn + 1/2 * H * K1)

        //third order deriv
        deepCopy(deriv, K2);
        stateMultScalar(deriv, H * 0.5);
        addState(deriv, springy.STATE);
        deepCopy(K3, F(deriv)); //K3 = F(Xn + 1/2 * H * K2)

        //fourth order deriv
        deepCopy(deriv, K3);
        stateMultScalar(deriv, H);
        addState(deriv, springy.STATE);
        deepCopy(K4, F(deriv)); //K4 = F(Xn + H * K3)

        stateMultScalar(K2, 2);
        stateMultScalar(K3, 2);
        addState(K1, K2);
        addState(K1, K3);
        addState(K1, K4);
        
        //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6
        integrateState(springy.STATE, K1, H/6);
    }
    else {              /******************************************* euler integration */ 
        integrateState(springy.STATE, deriv, H);
    }
    
    //COLLISION DETECTIO
    
    //Edge-Edge Collision
    for (var j=0; j<springy.mesh.struts.length; j++){
        var strut = springy.mesh.struts[j].vertices;
        var edgeResponse = edgeEdgeResponse(strut, 
                                            springy.mesh, 
                                            springy.STATE[strut[0]], 
                                            springy.STATE[strut[1]], 
                                            springy.STATE[strut[0] + springy.count], 
                                            springy.STATE[strut[1] + springy.count]);    
        if(edgeResponse){
            springy.STATE[strut[0]].copy(edgeResponse[0].xNew);
            springy.STATE[strut[0] + springy.count].copy(edgeResponse[0].vNew);
            springy.STATE[strut[1]].copy(edgeResponse[1].xNew);
            springy.STATE[strut[1] + springy.count].copy(edgeResponse[1].vNew);
            
            //only one collision per frame
            break;
        }
    }
    
    //Vertex Face Collision
    for (var i = 0; i < springy.count; i++){
        var vertexResponse = vertexFaceResponse(oldState[i], springy.STATE[i], oldState[i + springy.count], springy.STATE[i + springy.count]);
        if (vertexResponse){
            springy.STATE[i].copy(vertexResponse.xNew);
            springy.STATE[i + springy.count].copy(vertexResponse.vNew);
        }
    }
        
    springy.moveParticles();
    springy.mesh.geometry.verticesNeedUpdate = true;
    springy.mesh.geometry.computeFaceNormals();

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
        var mesh = collidables[p];
        
        //all faces on the object
        for (var i=0; i < mesh.geometry.faces.length; i++){
            var face = mesh.geometry.faces[i];
            
            v1_mut.copy(x1);
            v2_mut.copy(x2);

            p0_mut.set(mesh.geometry.vertices[face.a].x + mesh.position.x, 
                       mesh.geometry.vertices[face.a].y + mesh.position.y,
                       mesh.geometry.vertices[face.a].z + mesh.position.z);
            p1_mut.set(mesh.geometry.vertices[face.b].x + mesh.position.x, 
                       mesh.geometry.vertices[face.b].y + mesh.position.y, 
                       mesh.geometry.vertices[face.b].z + mesh.position.z);
            p2_mut.set(mesh.geometry.vertices[face.c].x + mesh.position.x,
                       mesh.geometry.vertices[face.c].y + mesh.position.y, 
                       mesh.geometry.vertices[face.c].z + mesh.position.z);

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

                if (pointInFace(collisionX, p0_mut, p1_mut, p2_mut)){

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

function pointInFace(x, p0, p1, p2){
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
function edgeEdgeResponse(springyStrut, springyMesh, p1, p2, v1, v2){
    
    for (var i=0; i < collidables.length; i++){
        var mesh = collidables[i];
        for (var j=0; j < mesh.struts.length; j++){
            var strut = mesh.struts[j].vertices;
            
            q1.set(mesh.geometry.vertices[strut[0]].x + mesh.position.x, 
                    mesh.geometry.vertices[strut[0]].y + mesh.position.y,
                    mesh.geometry.vertices[strut[0]].z + mesh.position.z);
            q2.set(mesh.geometry.vertices[strut[1]].x + mesh.position.x, 
                    mesh.geometry.vertices[strut[1]].y + mesh.position.y, 
                    mesh.geometry.vertices[strut[1]].z + mesh.position.z);
            
            v1_mut.copy(p2).sub(p1); //a
            v2_mut.copy(q2).sub(q1); //b
            
            v3_mut.copy(v1_mut).cross(v2_mut).normalize(); //nHat
            
            v4_mut.copy(q1).sub(p1); //r
            
            v5_mut.copy(v1_mut).normalize(); //aHat
            v6_mut.copy(v2_mut).normalize(); //bHat
            
            v7_mut.copy(v5_mut).cross(v3_mut); // aHat x nHat 
            v8_mut.copy(v6_mut).cross(v3_mut); // bHat x nHat 
            
            var s = v4_mut.dot(v8_mut) / v1_mut.dot(v8_mut);        // r . (bHat x nHat) / a . (bHat x nHat)
            var t = -1 * v4_mut.dot(v7_mut) / v2_mut.dot(v7_mut);   // -r . (aHat x nHat) / b . (aHat x nHat)
            
            if (s < 0 || s > 1 || t < 0 || t > 1){
                continue;
            }
            else {
                pa.copy(v1_mut).multiplyScalar(s).add(p1); //pa = p1 +sa
                qa.copy(v2_mut).multiplyScalar(t).add(q1); //qa = q1 +tb   
                var dist = qa.clone().sub(pa).length(); //clone is for debugging
                if (dist < 0.3){ 
                    
                    var magnitude = v1_mut.copy(v1).add(v2).multiplyScalar(0.5).length(); //average magnitude
                    v4_mut.copy(v3_mut).multiplyScalar(magnitude); //points move in opposite direction
                
                    var response = [{
                        xNew : new THREE.Vector3(0,0,0),
                        vNew : new THREE.Vector3(0,0,0)
                    },{
                        xNew : new THREE.Vector3(0,0,0),
                        vNew : new THREE.Vector3(0,0,0) 
                    }];

                    v5_mut.copy(v4_mut).multiplyScalar(s-1);
                    v6_mut.copy(v4_mut).multiplyScalar(s);
                    
                    response[0].vNew.copy(v5_mut);
                    response[1].vNew.copy(v6_mut); 
                    
                    response[0].xNew.copy(integrateVector(p1, v5_mut, H));
                    response[1].xNew.copy(integrateVector(p2, v6_mut, H));
                                        
                    return response;    
                }
            }
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

function toggleRK4(elem){
    useRK4 = elem.checked;
}

/** gets the other vertex of a face */
function getOtherVertex(face, v1, v2){
    if ((face.a == v1 || face.a == v2) && (face.b == v1 || face.b == v2)){
        return face.c; 
    }
    else if ((face.c == v1 || face.c == v2) && (face.b == v1 || face.b == v2)){
        return face.a; 
    }
    else {
        return face.b;
    }
}
