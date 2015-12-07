/* jshint -W004 */
/* global doc, THREE, window, console, setTimeout, THREE, Util, App, clearTimeout */

/**
 *  Based on user input and whether the nodes are connected
 */
function getSpringConstant(node1, node2) {
    var constant = 0;
	if (node1.citations.has(node2.id) || node1.references.has(node2.id)){
		constant += App.physicsVars.citedByOrReferenced.attract;
	}
	
    
	if (node1.sharedAuthorPeeps.has(node2.id)){
		constant += App.physicsVars.sharedAuthor.attract;
	}
    
	for (var key in node1.sharedKeyWordPeeps){
        //muliple shared keyword makes it stronger
        if (node1.sharedKeyWordPeeps[key].has(node2.id)){
            constant += App.physicsVars.sharedKeyword.attract;
        }
    }
	//return 0;
    return 0.0000001 * constant;
}
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
	
	//return 0;
    return 0.000001 * constant;
}

function Simulator(nodeMap, keyArray){
    //TODO handle updates of nodemap/key array size
    
    var ATTRACT_TOUCH_DISTANCE = 10;
    var REPULSE_TOUCH_DISTANCE = 5;
    var slowdownAmount = 0.97;
    var bumpAmount = 1.03;
    
    var startState = [];
    var state_mut1 = [];
	var state_mut2 = [];
	var K1 = [];
	var K2 = [];
	var K3 = [];
	var K4 = [];
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
	
    for (var i=0; i < keyArray.length * 2; i++){
        startState[i] = new THREE.Vector3(Util.getRandom(-4, 4),Util.getRandom(-4, 4),Util.getRandom(-4, 4));
        state_mut1[i] = new THREE.Vector3(0,0,0);
		state_mut2[i] = new THREE.Vector3(0,0,0);       
		K1[i] = new THREE.Vector3(0,0,0);  
		K2[i] = new THREE.Vector3(0,0,0);  
		K3[i] = new THREE.Vector3(0,0,0);  
		K4[i] = new THREE.Vector3(0,0,0);  
    }
    for (var i=0; i < keyArray.length; i++){
        startState[i + keyArray.length] = new THREE.Vector3(0,0,0);
    }
    var myState = startState.clone();
	var size = startState.length / 2;
    
    var simTimeout;       //for starting and stopping the sim
    var clock;
    var H =  0.04 * 1000; // In milliseconds

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
    
	function addSpring(node, other, accel){
		
	}
	
    //gets the derivative of a state. plus external forces. returns deep copy of array
    function F(state){
       
        for (var i = 0; i < state.length / 2; i++){
            state_mut1[i].copy(state[i+size]);
        }
        
        // force direct that graph
		//skip the first node because it is anchored
        for (var i = 1; i < size; i++){
            var node = nodeMap[keyArray[i]];
            
            if (!node.inFilter) continue;

            disp = new THREE.Vector3(0,0,0);
            accel = new THREE.Vector3(0,0,0);
            
			/* */
            //attractive forces. 
			//TODO use edgelist and apply both at a time
            for(var j = 0; j < size; j++){	
                if (i == j) continue;
                
                var other = nodeMap[keyArray[j]];
                if (!other.inFilter) continue;

                var dist = state[i].distanceTo(state[j]);

                if(isFinite(dist)){
                    //reingold/nic fudging
                    //var delt = state[i].clone().sub(state[p]).multiplyScalar(1/dist);
                    //var tension = dist * getSpringConstant(node, other);
                    //delt.multiplyScalar(tension);
                    //disp.add(delt);

                    //actual springs
					var rlength = ATTRACT_TOUCH_DISTANCE;
					var k = getSpringConstant(node, other);
					
					if (k === 0) continue; //the nodes aren't connected
					
					var d = 2 * Math.sqrt(k) * 0.9; //make sure damping constant is cool
					var mass = 1;
					
					v1_mut.copy(state[i]); //x_i
					v2_mut.copy(state[j]); //x_j
					v3_mut.copy(v2_mut).sub(v1_mut); //x_ij
					v4_mut.copy(v3_mut).normalize(); //x_ij_hat

					v5_mut.copy(v4_mut).multiplyScalar( (dist - rlength) * k); //fs

					v8_mut.copy(v5_mut).multiplyScalar(1/mass); //f_s_i / mass
					accel.add(v8_mut); //spring force
   
					v6_mut.copy(state[j + size]); // v_j
					v6_mut.sub(state[i + size]); //v_j - v_i
					v7_mut.copy(v4_mut).multiplyScalar(v6_mut.dot(v4_mut) * d); 
					
					//force to accel
					v8_mut.copy(v7_mut).multiplyScalar(1/mass); //f_s_i / mass
					accel.add(v8_mut); //damp force
                }  
            }
			
			/* */
            //repulsive forces
            for(var p = 0; p < size; p++){		
                if (i == p) continue;
                
                var other = nodeMap[keyArray[p]];
                if (!other.inFilter) continue;

                var dist = state[i].distanceTo(state[p]);

                //TODO handle when they are right on top of each other?
                if(dist > 0 && dist < REPULSE_TOUCH_DISTANCE){
                    //var delt = state[i].clone().sub(state[p]).multiplyScalar(1/dist);
                    //var tension = getRepulseConstant(node, other) * ((TOUCH_DISTANCE - dist) / TOUCH_DISTANCE); 
                    //delt.multiplyScalar(tension);
                    //disp.add(delt);

                    var normal = state[i].clone().sub(state[p]).normalize(); //push away from other
                    var force = getRepulseConstant(node, other) / (dist*dist); //mass of 1
                    accel.add(normal.multiplyScalar(force)); // mass of 1
                }
            }
			
            state_mut1[i + size].copy(accel);
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

        //just Euler
        //integrateState(state, K1, H);
        
        // /*
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
        // */
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
		energyMod++;
        if (energyMod % 100 === 0){
            console.log(energy);
        }
        
		myState.copy(state);
        

        var waitTime = H - clock.getDelta(); 
        if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
            console.log("simulation getting behind and slowing down!");
        }
        simTimeout = setTimeout(simulate, waitTime, state, slowdownAmount);
    }
}

//var x = new Simulator(graph, [1,2,3,4,5]);
//x.start();
