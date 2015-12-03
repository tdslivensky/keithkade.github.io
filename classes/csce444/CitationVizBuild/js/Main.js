/* global doc, UI, Simulator, GraphRenderer, requestAnimationFrame, Util */


var App = {};
App.physicsVars = {
	sharedKeyword : {attract : 5, repulse: 5},
	sharedClassification : {attract : 5, repulse: 5},
	sharedAuthor : {attract : 5, repulse: 5},
	citedByOrReferenced : {attract : 5, repulse: 5}
};



var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-keyword-sliders'), 'Shared Keyword', App.physicsVars.sharedKeyword);
var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-classification-sliders'), 'Shared Classification', App.physicsVars.sharedClassification);
var sharedAuthorSliders = new UI.PhysicSliders(doc.getElementById('shared-author-sliders'), 'Shared Author', App.physicsVars.sharedAuthor);
var citedBySliders = new UI.PhysicSliders(doc.getElementById('cited-sliders'), 'Cited by / Referenced', App.physicsVars.citedByOrReferenced);


var yearFilterSlider = new UI.FilterSlider(doc.getElementById('year-filter'), 
                                           'Year', 
                                           [2010, 2011, 2013, 2015, 2016], 
                                           [1, 3, 2, 5, 1]
                                          );

var countFilterSlider = new UI.FilterSlider(doc.getElementById('citation-count-filter'), 
                                            'Citation Count', 
                                            [0, 1, 2, 3, 4, 5, 6, 7], 
                                            [56, 1, 22, 3, 4, 0, 1, 1]
                                           );

var keywordFilter = new UI.FilterDropdown(doc.getElementById('keyword-filter'), 'Filter Keyword', ['one', 'two', 'three']);
//-------------------------
// Globals
//-------------------------

// ForceStrengthVariables
//  TODO name them

var graph = {
    "1":{
        "id":"1",
        "citation_count":7,
        "title":"Computer environments for children: a reflection on theories of learning and education",
        "year":null,
        "citations":["3","4","5"],
        "references":[],
        "sharedAuthorPeeps":["1","2"],
        "sharedKeyWordPeeps":{}
    },
    "2":{
        "id":"2",
        "citation_count":28,
        "title":"Boxer: a reconstructible computational medium",
        "year":1986,
        "citations":["1","3"],
        "references":["4","5"],
        "sharedAuthorPeeps":["3","4"],
        "sharedKeyWordPeeps":{}
    },
    "3":{
        "id":"3",        
        "citation_count":814,
        "title":"Plans and situated actions: the problem of human-machine communication",
        "year":null,
        "citations":["1","2","5"],
        "references":[],
        "sharedAuthorPeeps":["1"],
        "sharedKeyWordPeeps":{}
    },
    "4":{
        "id":"4",                
        "citation_count":84,
        "title":"Node 4",
        "year":null,
        "citations":["1","3","2","5"],
        "references":[],
        "sharedAuthorPeeps":["1"],
        "sharedKeyWordPeeps":{}
    },
    "5":{
        "id":"5",                        
        "citation_count":4,
        "title":"Node 5",
        "year":null,
        "citations":["2","4","1"],
        "references":[],
        "sharedAuthorPeeps":["3"],
        "sharedKeyWordPeeps":{}
    }    
};


// GraphNode Maps and metadata Maps
var metaDataMap  = getMetaDataMap();
var globalGraphNodeMap = getGlobalGraphNodeMap();
var globalGraphNodeKeyArray = keyArray(globalGraphNodeMap);
var localGraphNodeMap      = {};
var localGraphNodeKeyArray  = [];

var globalSimulator = new Simulator(globalGraphNodeMap , globalGraphNodeKeyArray);
var globalGraphRenderer = new GraphRenderer(globalGraphNodeMap , globalGraphNodeKeyArray, globalSimulator , 'explore-graph');

var localSimulator  = new Simulator(localGraphNodeMap , localGraphNodeKeyArray);
var localGraphRenderer = new GraphRenderer(localGraphNodeMap , localGraphNodeKeyArray, localSimulator ,'personal-graph');

// Start request animation frame that tells both simulators to sim and both graphRenderers to render
initAnimationLoop();

initFilterChangeEvents();
initMouseClickEvents();


function initFilterChangeEvents() {
    // Set up callback for filter changes that....
    /*
    if ( changeInForceStrength ) {
       // Set global value for that strenght to new value
    }

    if ( changeInFilter ) {
       // Figure out who's in and whos out
       // for each x in globalGraphNodeMap[i]
       //   x.inFilter = newValue { false / true }
       //
    }
    */
}
function initMouseClickEvents() {
    // Add mouse click handlers for both canvas
    /*
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
     var that = this;
     renderer.domElement.addEventListener( 'mousedown', function(event) {
     event.preventDefault();
     var clickedObjects = that.getClickedObjects(event);
     console.log(clickedObjects);
     }, false );

    */
}



function getMetaDataMap() {
    /*
    try {
        if ( metadataCache) {
            return metadataCache;
        } else {
            throw "No metadataCache";
        }
    }
    finally {

    }
    */
}

function getGlobalGraphNodeMap() {
    Util.arrayToSet(graph);
    return graph;
    /*
    try {
        if (nodeData) {
            return nodeData;
        } else {
            throw "No globalGraphNodeMap";
        }
    }
    finally {

    }
    */
}

function keyArray(map) {
    var array = [];
    for( var key in map) {
        array.push(key);
    }
    return array;
}

function initAnimationLoop() {
    //localSimulator.start();
    requestAnimationFrame(renderLoop);
}

function start() {
    globalSimulator.start();
}

function renderLoop() {
    requestAnimationFrame(renderLoop);
    localGraphRenderer.render();
    globalGraphRenderer.render();
}
