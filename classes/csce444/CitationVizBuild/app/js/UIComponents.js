/* global doc, console, Util */

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
	//order of adding attributes matters for value
	if (opts && 'value' in opts){
		elem.value = opts.value;
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
 * Component for controlling attract/repulse for one physics dimension
 */
UI.PhysicSliders = function(container, title, bindTo, onchange){
    container.className = 'phys-slider-container';

    //PRIVATE
    var titleDisp = createElem('span', {className: 'phys-slider-title', innerHTML: title});
    var attractIcon = createElem('img', {className: 'icon', src: 'img/AttractIcon.svg', title: 'Attract Force'});
    var repulseIcon = createElem('img', {className: 'icon', src: 'img/RepulseIcon.svg', title: 'Repulse Force'});
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
        bindTo.attract = this.attractVal;
		onchange();
    }.bind(this);
    
    repulseSlider.oninput = function(){
        this.repulseVal = parseInt(repulseSlider.value);
		bindTo.repulse = this.repulseVal;
		onchange();
    }.bind(this); 

    addChildren(this.elem, [titleDisp, attractIcon, attractSlider, createElem('br'), repulseIcon, repulseSlider]);
};
    
/** 
 * Double-ended filter slider . TODO right side not starting and dark part not working
 */
UI.FilterSlider = function(container, title, graphData, attr, onchange){
    container.className = 'filter-slider';

    //PRIVATE     
    var vals = Util.getXYValsFromGraph(graphData, attr);
    var xVals = vals.x;
    var yVals = vals.y;
    
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
        lScreen.style.width = stepSize * lIndex + 'px'; //FIXME
        this.lVal = this.xData[lIndex];
        lValDisp.innerHTML = this.lVal;
		onchange();		
    }
    
    function onRSlideMove(){
        rIndex = parseInt(rSlide.value);
        if (lIndex >= rIndex){
            rSlide.value = lIndex + 1;
            rIndex = lIndex + 1;
        }   
        rScreen.style.width = stepSize * (max - rIndex) + 'px'; //FIXME
        this.rVal = this.xData[rIndex - 1];
        rValDisp.innerHTML = this.rVal;
		onchange();		
    }

};

/**
 * Multi-select dropdown
 */
UI.FilterDropdown = function(container, title, list, onchange){
    container.className = 'filter-dropdown collapsed';
    
    //PRIVATE
    var titleSpan = createElem('span', {className: 'dropdown-title', innerHTML: title + ' <span class="dropdown-caret">&#9660;</span>'});
    
    //PUBLIC
    this.elem = container;
    this.options = [];

    
    this.elem.appendChild(titleSpan);
    for (var i = 0; i < list.length; i++){
        this.options.push({value: list[i], selected: true});
        var opt = createElem('li', {innerHTML: '<input type="checkbox"> ' + list[i]});
        opt.onclick = filterSelect.bind(this);
        this.elem.appendChild(opt);
    }
    
    //toggle class on click
    titleSpan.onclick = function (){
        var list = this.elem.classList;
        if (this.elem.classList.contains('collapsed')){
            list.remove('collapsed');
            list.add('expanded');
        }
        else {
            list.remove('expanded');
            list.add('collapsed');
        }        
    }.bind(this);
    
    //not the most efficient but probably not an issue
    function filterSelect(){
        var list = this.elem.getElementsByTagName('input');
        for (var i = 0; i < list.length; i++){
            this.options[i].selected = list[i].checked;
        }
		onchange();
    }
    
};    
    
})();