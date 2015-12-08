/* global doc, UI, Simulator, GraphRenderer, requestAnimationFrame, Util, console, BSAutoSwitch, document, MICE, nodeData, RendererBase, metadataCache, window, RepoMan, Filter, XMLHttpRequest, simpl */

//Load up the mmd of acm portal
var mmd;
function instantiate() {
    var request = new XMLHttpRequest();
    request.onload = function(e){
        mmd = JSON.parse(request.response);
        simpl.graphExpand(mmd);
    };
    request.open('GET', 'http://ecology-service.cs.tamu.edu/BigSemanticsService/mmd.json?name=acm_portal');
    request.send();
}
instantiate();

var App = {};

//Bound to UI sliders
App.physicsVars = {
	sharedKeyword : {attract : 5, repulse: 5},
	sharedClassification : {attract : 5, repulse: 5},
	sharedAuthor : {attract : 5, repulse: 5},
	citedByOrReferenced : {attract : 5, repulse: 5}
};

// GraphNode Maps and metadata Maps
var metadataMap = getMetaDataMap();
var globalGraphNodeMap = getGlobalGraphNodeMap();
var globalGraphNodeKeyArray = Util.keyArray(globalGraphNodeMap);
var localGraphNodeMap      = {};
var localGraphNodeKeyArray  = [];

var globalSimulator = new Simulator(globalGraphNodeMap , globalGraphNodeKeyArray);
var globalGraphRenderer = new GraphRenderer(globalGraphNodeMap , globalGraphNodeKeyArray, globalSimulator , 'explore-graph');

var localSimulator  = new Simulator(localGraphNodeMap , localGraphNodeKeyArray);
var localGraphRenderer = new GraphRenderer(localGraphNodeMap , localGraphNodeKeyArray, localSimulator ,'personal-graph');

var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-keyword-sliders'), 'Shared Keyword', App.physicsVars.sharedKeyword, onUserInput);
//var sharedClassificationSliders = new UI.PhysicSliders(doc.getElementById('shared-classification-sliders'), 'Shared Classification', App.physicsVars.sharedClassification, onUserInput);
var sharedAuthorSliders = new UI.PhysicSliders(doc.getElementById('shared-author-sliders'), 'Shared Author', App.physicsVars.sharedAuthor, onUserInput);
var citedBySliders = new UI.PhysicSliders(doc.getElementById('cited-sliders'), 'Cited by / Referenced', App.physicsVars.citedByOrReferenced, onUserInput);

var yearFilterSlider = new UI.FilterSlider(doc.getElementById('year-filter'), 'Year', globalGraphNodeMap, 'year', onUserInput);

var countFilterSlider = new UI.FilterSlider(doc.getElementById('citation-count-filter'), 'Citation Count', globalGraphNodeMap, 'citation_count', onUserInput);

var keywordFilter = new UI.FilterDropdown(doc.getElementById('keyword-filter'), 'Filter Keyword', ['one', 'two', 'three'], onUserInput);


// Start request animation frame that tells both simulators to sim and both graphRenderers to render
initAnimationLoop();
initMouseClickEvents();
applyFilter();

function onUserInput(){
    globalSimulator.bump();
    applyFilter();
}

function applyFilter(){
    function rangeList(min , max) {
        var values = [];
        for  (var y = min; y <= max; y++) {
            values.push(y);
        }
        return values;
    }

    var filters = [];
    // Year filter
    var min = yearFilterSlider.lVal;
    var max = yearFilterSlider.rVal;
    var yearFilter = {
        field: 'year',
        values: rangeList(min,  max)
    };
    filters.push(yearFilter);

    // Citation filter
    min = countFilterSlider.lVal;
    max = countFilterSlider.rVal;
    var citationFilter = {
        field: 'citation_count',
        values: rangeList(min , max)
    };
    filters.push(citationFilter);

    // Key word filter
    var keywords = [];
    for ( var i = 0; i < keywordFilter.options.length; i++) {
        var option = keywordFilter.options[i];
        if ( option.selected ) {
            keywords.push(option.value);
        }
    }
    var keyWordsFilter = {
        field: 'keywords',
        fieldType: 'set',
        values: keywords
    };

    Filter(globalGraphNodeMap , filters);    
}

function getMetaDataMap() {
    try {
        if (metadataCache) {
            return metadataCache;
        } else {
            throw "No metadataCache";
        }
    }
    finally {

    }
}

function getGlobalGraphNodeMap() {
    try {
        if (nodeData) {
            Util.arrayToSet(nodeData);
			return nodeData;
        } else {
            throw "No globalGraphNodeMap";
        }
    }
    finally {

    }
}

function start() {
    //localSimulator.start();    
    globalSimulator.start();
}
start();

function initAnimationLoop() {
    requestAnimationFrame(renderLoop);
}

function renderLoop() {
    requestAnimationFrame(renderLoop);
    localGraphRenderer.render();
    globalGraphRenderer.render();
}

// ==================================================================== User Input Handlers
function keydown(event){
    if (event.keyCode == 16){
        doc.getElementById('settings-panel').style.display = 'block';
    }  
}
function keyup(event){
    if (event.keyCode == 16){
        doc.getElementById('settings-panel').style.display = 'none';
    }      
}
window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);

function initMouseClickEvents() {
    // Add mouse click handlers for both canvas
    var localHandler = function(x , y ) {
        var objects = localGraphRenderer.getClickedObjects(x,y);
        if ( objects ) {
           //dealWithLocalNodeClicked;
        }
    };

    var globalHandler = function(x , y ) {
        var objects = globalGraphRenderer.getClickedObjects(x,y);
        if ( objects ) {
            //dealWithGlobalNodeClicked;
        }
    };

    localGraphRenderer.renderer.domElement.addEventListener( 'mousedown' , function(event)  {
        var objects = localGraphRenderer.getClickedObjects(event);
        if ( objects ) {
            console.log(objects);
        }
    });

    globalGraphRenderer.renderer.domElement.addEventListener( 'mousedown' , function(event)  {
        var objects = globalGraphRenderer.getClickedObjects(event);
        if ( objects && objects.length > 0 ) {
            console.log(objects);
            var node = objects[0];
            var url = 'http://dl.acm.org/citation.cfm?preflayout=flat&id=' + node.id;
            var content = document.getElementById("mice");
            var options = {};
            var clipping = {};
            clipping.metadata = metadataMap[url];
            clipping.mmd = mmd;
            RendererBase.addMetadataDisplay(content , url , clipping , MICE.render, options);
        }
    });
}
