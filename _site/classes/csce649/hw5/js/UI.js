/* global doc, initialX:true, initialV:true, G:true, H:true, H_MILLI:true, useRK4:true */

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
}

/** these might be able to be be optimized. lots of code */ 
function getUserInputs(){    
    G.x = parseFloat(doc.getElementById("g.x").value);
    G.y = parseFloat(doc.getElementById("g.y").value);
    G.z = parseFloat(doc.getElementById("g.z").value);
    
    H = parseFloat(doc.getElementById("H").value);    
    H_MILLI = H * 1000;    
}

function toggleRK4(elem){
    useRK4 = elem.checked;
}