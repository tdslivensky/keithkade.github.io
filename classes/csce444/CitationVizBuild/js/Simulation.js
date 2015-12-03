/* jshint -W004 */
/* global doc, THREE, window, console, setTimeout, THREE, Util, App */

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
    for (var key in node1.sharedAuthorPeeps){
        //muliple shared keyword makes it stronger
        if (node1.sharedKeyWordPeeps[key].has(node2.id)){
            constant += App.physicsVars.sharedKeyword.attract;
        }
    }

    //return 0;
    return 0.00001 * constant;
}
function getRepulseConstant(node1, node2) {
    //through the power of sets, find this    
    
    return 0;
    //return 0.001;
}

function Simulator(nodeMap, keyArray){
    //TODO handle updates of nodemap/key array size
    
    var ATTRACT_TOUCH_DISTANCE = 1;
    var REPULSE_TOUCH_DISTANCE = 5;
    
    var startState = [];
    var deriv = [];
    for (var i=0; i < keyArray.length * 2; i++){
        startState[i] = new THREE.Vector3(Util.getRandom(-4, 4),Util.getRandom(-4, 4),Util.getRandom(-4, 4));
        deriv[i] = new THREE.Vector3(0,0,0);        
    }
    for (var i=0; i < keyArray.length; i++){
        startState[i + keyArray.length] = new THREE.Vector3(0,0,0);
    }
    var myState = startState.clone();
    
    var simTimeout;       //for starting and stopping the sim
    var clock;
    var H =  0.02 * 1000; // In milliseconds

    /** create the sphere and set it according to user inputs, then start simulation and rendering */
    this.start = function(){    
        clock = new THREE.Clock();
        clock.start();
        clock.getDelta();
        window.clearTimeout(simTimeout);
        simulate(startState);
    };

	this.getState = function(){
		return myState;
	};
	
    //gets the derivative of a state. plus external forces. returns deep copy of array
    function F(state){
        var size = state.length / 2;

        for (var i = 0; i < state.length / 2; i++){
            deriv[i].copy(state[i+size]);
        }
        
        // force direct that graph
        for (var i = 0; i < size; i++){
            var node = nodeMap[keyArray[i]];

            var disp = new THREE.Vector3(0,0,0);
            var accel = new THREE.Vector3(0,0,0);
            
            //attractive forces. 
            for(var p = 0; p < size; p++){	
                if (i == p) continue;
                
                var other = nodeMap[keyArray[p]];
                var dist = state[i].distanceTo(state[p]);

                if(dist > ATTRACT_TOUCH_DISTANCE && isFinite(dist)){
                    //reingold/nic fudging
                    //var delt = state[i].clone().sub(state[p]).multiplyScalar(1/dist);
                    //var tension = dist * getSpringConstant(node.id, other.id);
                    //delt.multiplyScalar(tension);
                    //disp.add(delt);

                    //actual springs
                    var normal = state[p].clone().sub(state[i]).normalize(); //pull towards other
                    var force = dist * getSpringConstant(node, other);
                    accel.add(normal.multiplyScalar(force)); // mass of 1
                }  
            }

            //repulsive forces
            for(var p = 0; p < size; p++){		
                if (i == p) continue;
                
                var other = nodeMap[keyArray[p]];
                var dist = state[i].distanceTo(state[p]);

                //TODO handle when they are right on top of each other?
                if(dist > 0 && dist < REPULSE_TOUCH_DISTANCE){
                    //var delt = state[i].clone().sub(state[p]).multiplyScalar(1/dist);
                    //var tension = getRepulseConstant(node.id, other.id) * ((TOUCH_DISTANCE - dist) / TOUCH_DISTANCE); 
                    //delt.multiplyScalar(tension);
                    //disp.add(delt);

                    var normal = state[i].clone().sub(state[p]).normalize(); //push away from other
                    var force = getRepulseConstant(node, other) / (dist*dist); //mass of 1
                    accel.add(normal.multiplyScalar(force)); // mass of 1
                }
            }
            deriv[i + size].copy(accel);
        }
    
        return deriv.clone();
    }

    function integrateState(state, deriv, timestep){
        deriv.multiply(timestep);
        state.add(deriv);    
    }

    function rk4Integrate(state){
        deriv = F(state); 
        var K1 = deriv.clone();//K1 = F(Xn)

        //just Euler
        //integrateState(state, K1, H);
        
        // /*
        //second order deriv
        deriv = K1.clone();
        deriv.multiply(H * 0.5);
        deriv.add(state);
        var K2 = F(deriv); //K2 = F(Xn + 1/2 * H * K1)

        //third order deriv
        deriv = K2.clone();
        deriv.multiply(H * 0.5);
        deriv.add(state);
        var K3 = F(deriv); //K3 = F(Xn + 1/2 * H * K2)

        //fourth order deriv
        deriv = K3.clone();
        deriv.multiply(H);
        deriv.add(state);
        var K4 = F(deriv); //K4 = F(Xn + H * K3)

        K2.multiply(2);
        K3.multiply(2);
        K1.add(K2);
        K1.add(K3);
        K1.add(K4); //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6

        integrateState(state, K1, H/6);  
        // */
    }

    /** the main simulation loop. recursive */ 
    function simulate(state){ 
        rk4Integrate(state);

        //TODO update the nodeMap from the new state
		myState = state.clone();
        
        var waitTime = H - clock.getDelta(); 
        if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
            console.log("simulation getting behind and slowing down!");
        }
        simTimeout = setTimeout(simulate, waitTime, state);
    }
}

//var x = new Simulator(graph, [1,2,3,4,5]);
//x.start();
