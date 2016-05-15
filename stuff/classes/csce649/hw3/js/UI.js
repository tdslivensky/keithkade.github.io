/* global doc, initialX:true, initialV:true, G:true, H:true, H_MILLI:true, Util, moveZooka*/

/************* Functions for handling user input *************/

/** 
 * refresh the values of our constants on input change. and tell simulation to start back up if neccesary
 * also binds the sliders to the text inputs using the optional elem and id parameters
 */
function inputChange(elem, id){
    if (elem && id){
        doc.getElementById(id).value = elem.value;
    }
    getUserInputs();
    moveZooka();
}

/** these might be able to be be optimized. lots of code */ 
function getUserInputs(){
    
    initialX.x = parseFloat(doc.getElementById("p.x").value);
    initialX.y = parseFloat(doc.getElementById("p.y").value);
    initialX.z = parseFloat(doc.getElementById("p.z").value);

    initialV.x = parseFloat(doc.getElementById("v.x").value);
    initialV.y = 0;
    initialV.z = 0;
    
    G.x = parseFloat(doc.getElementById("g.x").value);
    G.y = parseFloat(doc.getElementById("g.y").value);
    G.z = parseFloat(doc.getElementById("g.z").value);
    
    H = parseFloat(doc.getElementById("H").value);    
    H_MILLI = H * 1000;    
}

function resetUserInputs(){
    doc.getElementById("p.x").value = 3;
    doc.getElementById("p.y").value = 7;
    doc.getElementById("p.z").value = 5;
    doc.getElementById("p.x-slider").value = 3;
    doc.getElementById("p.y-slider").value = 7;
    doc.getElementById("p.z-slider").value = 5;

    doc.getElementById("v.x").value = 20;
    doc.getElementById("v.x-slider").value = 20;   
    
    doc.getElementById("g.x").value = 0;
    doc.getElementById("g.y").value = -1;
    doc.getElementById("g.z").value = 0;
    doc.getElementById("g.x-slider").value = 0;
    doc.getElementById("g.y-slider").value = -1;
    doc.getElementById("g.z-slider").value = 0;    

    doc.getElementById("H").value = 0.016;    
    H_MILLI = H * 1000;    
    
    getUserInputs();
    moveZooka();
}

function randomizeUserInputs(){
    var randX = Util.getRandom(2,8);
    var randY = Util.getRandom(2,8);
    var randZ = Util.getRandom(2,8);

    doc.getElementById("p.x").value = randX;
    doc.getElementById("p.y").value = randY;
    doc.getElementById("p.z").value = randZ;
    doc.getElementById("p.x-slider").value = randX;
    doc.getElementById("p.y-slider").value = randY;
    doc.getElementById("p.z-slider").value = randZ;

    randX = Util.getRandom(-100, 100);
    doc.getElementById("v.x").value = randX;
    doc.getElementById("v.x-slider").value = randX;
 
    randX = Util.getRandom(-10, 10);
    randY = Util.getRandom(-10, 10);
    randZ = Util.getRandom(-10, 10);
    doc.getElementById("g.x").value = randX;
    doc.getElementById("g.y").value = randY;
    doc.getElementById("g.z").value = randZ;
    doc.getElementById("g.x-slider").value = randX;
    doc.getElementById("g.y-slider").value = randY;
    doc.getElementById("g.z-slider").value = randZ;  

    doc.getElementById("H").value = Util.getRandom(0.016, 0.1);    
    H_MILLI = H * 1000;    
    
    getUserInputs();
    moveZooka();    
}