/* global doc, console */

var UI = {};

//namespace
(function(){

var FILTER_SLIDER_WIDTH = 200;
var FILTER_SLIDER_HEIGHT = 20;    
var FILTER_KNOB_WIDTH = 8;

function addChildren(parent, arr){
    for (var i=0; i<arr.length; i++){
        parent.appendChild(arr[i]);
    }
}
    
function createElem(type, opts){
    var elem = doc.createElement(type);
    for (var key in opts){
        elem[key] = opts[key];
    }
    return elem;
}

function createGraph(yData){
    var container = createElem('span', {className: 'slide-graph'});
    var count = yData.length;
    
    var max = yData.max();
    
    for (var i = 0; i < count; i++){
        var bar = createElem('span', {className: 'bar'});
        bar.style.width = FILTER_SLIDER_WIDTH / count + 'px';
        var height = Math.ceil(yData[i] * FILTER_SLIDER_HEIGHT / max);
        bar.style.height = height + 'px';
        container.appendChild(bar);
    }
    return container;
}
    
/** 
 * Double-ended filter slider 
 */
UI.FilterSlider = function(container, title, xVals, yVals){
    container.className = 'filter-slider';

    //PRIVATE     
    var min = 0;
    var max = xVals.length;
    var stepSize = FILTER_SLIDER_WIDTH / max;
   
    //displays for selected values
    var lValDisp = createElem('span', {className: 'filter-val-disp'});
    var rValDisp = createElem('span', {className: 'filter-val-disp'});
    
    // screens for non selected areas 
    var lScreen = createElem('div', {className: 'filter-curtain'});
    var rScreen = createElem('div', {className: 'filter-curtain'});
   
    //the grabby bits
    var lSlide = createElem('input', {className: 'filter-slide-end l-slide', type: 'range', value: min, min: min, max: max, step: '1'});
    var rSlide = createElem('input', {className: 'filter-slide-end r-slide', type: 'range', value: max, min: min, max: max, step: '1'});
    
    var lIndex = min;
    var rIndex = max;   // the slider is one longer than the data, the right value is offset one from the right index
    var graph = createGraph(yVals);     // graph of y values

    var titleDisp = createElem('span', {className: 'filter-slide-title', innerHTML: title});
    
    //PUBLIC
    this.elem = container;
    this.xData = xVals;
    this.lVal = xVals[min];
    this.rVal = xVals[max-1];

    //update values
    lSlide.oninput = onLSlideMove.bind(this);
    rSlide.oninput = onRSlideMove.bind(this);
        
    lScreen.style.left = FILTER_KNOB_WIDTH + 'px';
    rScreen.style.right = -FILTER_KNOB_WIDTH + 'px';
    
    rValDisp.style.right = FILTER_KNOB_WIDTH + 'px';   
    rValDisp.innerHTML = this.rVal;
    
    lValDisp.style.left = FILTER_KNOB_WIDTH + 'px';   
    lValDisp.innerHTML = this.lVal;
    
    addChildren(this.elem, [lSlide, rSlide, graph, lScreen, rScreen, lValDisp, rValDisp, titleDisp]);
        
    /** Make sure you can't drag sliders too far */
    function onLSlideMove(){
        lIndex = parseInt(lSlide.value);
        if (lIndex >= rIndex){
            lSlide.value = rIndex - 1;
            lIndex = rIndex - 1;
        }
        lScreen.style.width = stepSize * lIndex + 'px';
        this.lVal = this.xData[lIndex];
        lValDisp.innerHTML = this.lVal;
    }
    
    function onRSlideMove(){
        rIndex = parseInt(rSlide.value);
        if (lIndex >= rIndex){
            rSlide.value = lIndex + 1;
            rIndex = lIndex + 1;
        }   
        rScreen.style.width = stepSize * (max - rIndex) + 'px';
        this.rVal = this.xData[rIndex - 1];
        rValDisp.innerHTML = this.rVal;
    }

};

/**
 * Component for controlling attract/repulse for one physics dimension
 */
UI.PhysicSliders = function(container, title){
    container.className = 'phys-slider-container';

    //PRIVATE
    var titleDisp = createElem('span', {className: 'phys-slider-title', innerHTML: title});
    var attractIcon;
    var repulseIcon;
    var attractSlider = createElem('input', {className: 'phys-slider', type: 'range', value: 5, min: 0, max: 10, step: '1'});
    var repulseSlider = createElem('input', {className: 'phys-slider', type: 'range', value: 5, min: 0, max: 10, step: '1'});
    var attractMeter = createElem('div', {});
    var repulseMeter = createElem('div', {});
    
    //PUBLIC
    this.elem = container;
    this.attractVal = 5;
    this.repulseVal = 5;
    
    //update values
    attractSlider.oninput = function(){
        this.attractVal = parseInt(attractSlider.value);
        
    }.bind(this);
    
    repulseSlider.oninput = function(){
        this.repulseVal = parseInt(repulseSlider.value);
    }.bind(this); 

    //TODO icons
    //TODO have left part highlight
    
    
    addChildren(this.elem, [titleDisp, attractSlider, repulseSlider]);
};
    
//TODO filters    
    
})();