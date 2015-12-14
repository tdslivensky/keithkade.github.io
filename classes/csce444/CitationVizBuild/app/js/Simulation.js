/* jshint -W004 */
/* global doc, THREE, window, console, setTimeout, THREE, Util, App, clearTimeout */

var ATTRACT_FACTOR = 0.000001;
var REPULSE_FACTOR = 0.001;
var SPRING_LENGTH = 2;
var REPULSE_TOUCH_DISTANCE = 40;

/**
 *  Based on user input and whether the nodes are connected
 */
function getRepulseConstant(node1, node2) {
    var constant = 0;
	if (!node1.citations.has(node2.id) && !node1.references.has(node2.id)){
		constant += App.physicsVars.citedByOrReferenced.repulse;
	}
	if (!node1.sharedAuthorPeeps.has(node2.id)){
		constant += App.physicsVars.sharedAuthor.repulse;
	}
	for (var key in node1.sharedKeyWordPeeps){
        //muliple shared keyword makes it stronger
        if (!node1.sharedKeyWordPeeps[key].has(node2.id)){
            constant += App.physicsVars.sharedKeyword.repulse;
        }
    }
    return REPULSE_FACTOR * constant;
}

function makeEdgeLists(graph, keyArray){
	var edges = {
		citedByOrReferenced : [],
		sharedAuthor : [],
		sharedKeyword : []
	};
	for (var i = 0; i < keyArray.length; i++){
		var node1 = graph[keyArray[i]];
		
		for (var j = 0; j < keyArray.length; j++){
			if (i == j) continue;
			
			var node2 = graph[keyArray[j]];
			if (node1.citations.has(node2.id) || node1.references.has(node2.id)){
				edges.citedByOrReferenced.push([i, j].sort());
			}
			if (node1.sharedAuthorPeeps.has(node2.id)){
				edges.sharedAuthor.push([i, j].sort());
			}
			for (var key in node1.sharedKeyWordPeeps){
				//muliple shared keyword do not currently matter.
				if (node1.sharedKeyWordPeeps[key].has(node2.id)){
					edges.sharedKeyword.push([i, j].sort());
				}
			}
		}
	}
	Util.removeDuplicates(edges);
	var notEdges = inverseEdgeList(edges, keyArray);	
	return { list: edges, notList: notEdges};
}

function inverseEdgeList(edges, keyArray){
	var inverse = {};
	for (var key in edges){
		inverse[key] = [];
		for (var i = 0; i < keyArray.length; i++){
			for (var j = i; j < keyArray.length; j++){ //TODO test
				if (i==j) continue;

				if (edges[key].indexOfTuple([i,j]) == -1){
					inverse[key].push([i,j]);
				}
			}			
		}
	}
    //TODO too many edges
	return inverse;
}

function Simulator(nodeMap, keyArray){
    var SPREAD = 100;
	var slowdownAmount = 0.99;
    var bumpAmount = 1;
    
    var startState = [];
    var state_mut1 = [];
	var state_mut2 = [];
	var K1 = [];
	var K2 = [];
	var K3 = [];
	var K4 = [];
	var accels = [];
	var v1_mut = new THREE.Vector3();
	var v2_mut = new THREE.Vector3();
	var v3_mut = new THREE.Vector3();
	var v4_mut = new THREE.Vector3();
	var v5_mut = new THREE.Vector3();
	var v6_mut = new THREE.Vector3();
	var v7_mut = new THREE.Vector3();
	var v8_mut = new THREE.Vector3();
	var disp = new THREE.Vector3();	
	var accel = new THREE.Vector3();	
	
	var size = keyArray.length;
	
    for (var i=0; i < size * 2; i++){
        startState[i] = new THREE.Vector3(Util.getRandom(-1 * SPREAD, SPREAD),Util.getRandom(-1 * SPREAD, SPREAD),Util.getRandom(-1 * SPREAD, SPREAD));
        state_mut1[i] = new THREE.Vector3(0,0,0);
		state_mut2[i] = new THREE.Vector3(0,0,0);       
		K1[i] = new THREE.Vector3(0,0,0);  
		K2[i] = new THREE.Vector3(0,0,0);  
		K3[i] = new THREE.Vector3(0,0,0);  
		K4[i] = new THREE.Vector3(0,0,0);
    }
    for (var i=0; i < size; i++){
        startState[i + size] = new THREE.Vector3(0,0,0);
		accels[i] = new THREE.Vector3(0,0,0);  
    }
    var myState = startState.clone();
    
    var simTimeout;       //for starting and stopping the sim
    var clock;
	var fps = 30;
    var H =  1 / fps * 1000; // In milliseconds

	var edges = makeEdgeLists(nodeMap, keyArray); 
	var edgelist = edges.list;
	var notEdgelist = edges.notList;
	
    /** create the sphere and set it according to user inputs, then start simulation and rendering */
    this.start = function(){    
        clock = new THREE.Clock();
        clock.start();
        clock.getDelta();
        window.clearTimeout(simTimeout);
        simulate(startState, slowdownAmount);
    };

	this.getState = function(){
		return myState;
	};
	
    //on input change re-energize the system
    this.bump = function(){
        clearTimeout(simTimeout);
        simTimeout = setTimeout(simulate, H, myState, bumpAmount);
    };
    
    //gets the derivative of a state. plus external forces. returns deep copy of array
    function F(state){
       
        for (var i = 0; i < state.length / 2; i++){
            state_mut1[i].copy(state[i+size]);
        }
		for (var i = 0; i < accels.length; i++){
			accels[i].set(0,0,0);
		}
        
        //USE THE FORCE 
		
		//attractive forces
		for (var key in edgelist){
			for (var l = 0; l < edgelist[key].length; l++){
				var i = edgelist[key][l][0];
				var j = edgelist[key][l][1];
				var node = nodeMap[keyArray[i]];
				var other = nodeMap[keyArray[j]];
				
				if (!node.inFilter || !other.inFilter) continue;
				
                var dist = state[i].distanceTo(state[j]);

                if(isFinite(dist)){
					var rlength = SPRING_LENGTH;
					var k = ATTRACT_FACTOR * App.physicsVars[key].attract;
					
					if (k === 0) continue; //the nodes aren't connected
					
					var d = 2 * Math.sqrt(k) * 0.9; //make sure damping constant is cool
					var mass = 1;
					
					v1_mut.copy(state[i]); //x_i
					v2_mut.copy(state[j]); //x_j
					v3_mut.copy(v2_mut).sub(v1_mut); //x_ij
					v4_mut.copy(v3_mut).normalize(); //x_ij_hat

					v5_mut.copy(v4_mut).multiplyScalar( (dist - rlength) * k); //fs
					v8_mut.copy(v5_mut).multiplyScalar(1/mass); //f_s_i / mass
					
					accels[i].add(v8_mut); //spring force
   					accels[j].add(v8_mut.multiplyScalar(-1));
					
					v6_mut.copy(state[j + size]); // v_j
					v6_mut.sub(state[i + size]); //v_j - v_i
					v7_mut.copy(v4_mut).multiplyScalar(v6_mut.dot(v4_mut) * d); 
					
					v8_mut.copy(v7_mut).multiplyScalar(1/mass); //f_s_i / mass
					
					accels[i].add(v8_mut); //damp force
					accels[j].add(v8_mut.multiplyScalar(-1));
                }  				
			}
		}
		
		for (var key in notEdgelist){
			for (var l = 0; l < notEdgelist[key].length; l++){
				var i = notEdgelist[key][l][0];
				var j = notEdgelist[key][l][1];
				var node = nodeMap[keyArray[i]];
				var other = nodeMap[keyArray[j]];
				
				if (!node.inFilter || !other.inFilter) continue;
				
                var dist = state[i].distanceTo(state[j]);

                //TODO handle when they are right on top of each other?
                if(dist > 0 && dist < REPULSE_TOUCH_DISTANCE){
                    var normal = state[i].clone().sub(state[j]).normalize(); //push away from other
                    var force = (REPULSE_FACTOR * App.physicsVars[key].repulse) / (dist*dist*dist); //mass of 1
                    accels[i].add(normal.multiplyScalar(force)); 
                    accels[j].add(normal.multiplyScalar(-1)); 
                }			
			}
		}
		
		for (var i = 0; i < size; i++){
			state_mut1[i + size].copy(accels[i]);
		}
		
        return state_mut1;
    }

    function integrateState(state, deriv, timestep){
        deriv.multiply(timestep);
        state.add(deriv);    
    }

    function rk4Integrate(state){
        state_mut2.copy(F(state)); 
        K1 = state_mut2.clone();//K1 = F(Xn)

        //second order deriv
        state_mut2.copy(K1);
        state_mut2.multiply(H * 0.5);
        state_mut2.add(state);
        K2.copy(F(state_mut2)); //K2 = F(Xn + 1/2 * H * K1)

        //third order deriv
        state_mut2.copy(K2);
        state_mut2.multiply(H * 0.5);
        state_mut2.add(state);
        K3.copy(F(state_mut2)); //K3 = F(Xn + 1/2 * H * K2)

        //fourth order deriv
        state_mut2.copy(K3);
        state_mut2.multiply(H);
        state_mut2.add(state);
        K4.copy(F(state_mut2)); //K4 = F(Xn + H * K3)

        K2.multiply(2);
        K3.multiply(2);
        K1.add(K2);
        K1.add(K3);
        K1.add(K4); //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6
		
        integrateState(state, K1, H/6);  
    }

    var energyMod = 0;
    
    /** the main simulation loop. recursive */ 
    function simulate(state, timeFactor){ 
        rk4Integrate(state);

		var energy = 0;
		//HACK have the simulation slowly slow down over time. speeds up otherwise
		for (var i = 0; i < size; i++){
			state[i + size].multiplyScalar(timeFactor);
			energy += state[i + size].length();
		} 
		//energyMod++;
        //if (energyMod % 100 === 0){
        //    console.log(energy);
        //}
        
		myState.copy(state);
        

        var waitTime = H - clock.getDelta(); 
        if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
            console.log("simulation getting behind and slowing down!");
        }
        simTimeout = setTimeout(simulate, waitTime, state, slowdownAmount);
    }
}
