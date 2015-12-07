/* global doc, UI, Simulator, GraphRenderer, requestAnimationFrame, Util, console, BSAutoSwitch, document, MICE, nodeData, RendererBase, metadataCache, window, RepoMan, Filter */
var bsService;
var repo;
function instantiate() {
    //this is the IdeaMache extension id
    bsService = new BSAutoSwitch(['elkanacmmmdgbnhdjopfdeafchmhecbf']);
    repo = new RepoMan({url: "http://api.ecologylab.net/BigSemanticsService/mmdrepository.json?reload=true"});
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

var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-keyword-sliders'), 'Shared Keyword', App.physicsVars.sharedKeyword, onUserInput);
//var sharedClassificationSliders = new UI.PhysicSliders(doc.getElementById('shared-classification-sliders'), 'Shared Classification', App.physicsVars.sharedClassification, onUserInput);
var sharedAuthorSliders = new UI.PhysicSliders(doc.getElementById('shared-author-sliders'), 'Shared Author', App.physicsVars.sharedAuthor, onUserInput);
var citedBySliders = new UI.PhysicSliders(doc.getElementById('cited-sliders'), 'Cited by / Referenced', App.physicsVars.citedByOrReferenced, onUserInput);


var yearFilterSlider = new UI.FilterSlider(doc.getElementById('year-filter'), 
                                           'Year', 
                                           [1990, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2013, 2015, 2016], 
                                           [1, 2, 3, 4, 5, 6, 6, 7, 7, 1, 3, 2, 5, 1, 14, 15, 12],
										   onUserInput
                                          );

var countFilterSlider = new UI.FilterSlider(doc.getElementById('citation-count-filter'), 
                                            'Citation Count', 
                                            [0, 1, 2, 3, 4, 5, 6, 7, 8, 20, 50, 100, 200], 
                                            [56, 1, 22, 3, 4, 0, 1, 1, 8, 12, 11, 23, 1],
											onUserInput
                                           );

var keywordFilter = new UI.FilterDropdown(doc.getElementById('keyword-filter'), 'Filter Keyword', ['one', 'two', 'three'], onUserInput);
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
        "sharedKeyWordPeeps":{} ,
        "location": 'http://dl.acm.org/citation.cfm?id=6099'
    },
    "2":{
        "id":"2",
        "citation_count":28,
        "title":"Boxer: a reconstructible computational medium",
        "year":1986,
        "citations":["1","3"],
        "references":["4","5"],
        "sharedAuthorPeeps":["3","4"],
        "sharedKeyWordPeeps":{},
        "location": 'http://dl.acm.org/citation.cfm?id=6099'
    },
    "3":{
        "id":"3",        
        "citation_count":814,
        "title":"Plans and situated actions: the problem of human-machine communication",
        "year":null,
        "citations":["1","2","5"],
        "references":[],
        "sharedAuthorPeeps":["1"],
        "sharedKeyWordPeeps":{},
        "location": 'http://dl.acm.org/citation.cfm?id=6099'
    },
    "4":{
        "id":"4",                
        "citation_count":84,
        "title":"Node 4",
        "year":null,
        "citations":["1","3","2","5"],
        "references":[],
        "sharedAuthorPeeps":["1"],
        "sharedKeyWordPeeps":{},
        "location": 'http://dl.acm.org/citation.cfm?id=6099'
    },
    "5":{
        "id":"5",                        
        "citation_count":4,
        "title":"Node 5",
        "year":null,
        "citations":["2","4","1"],
        "references":[],
        "sharedAuthorPeeps":["3"],
        "sharedKeyWordPeeps":{},
        "location": 'http://dl.acm.org/citation.cfm?id=6099'
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
initMouseClickEvents();

function onUserInput(){
	console.log('input changed');
    globalSimulator.bump();

	// Figure out who's in and whos out
	// for each x in globalGraphNodeMap[i]
	//   x.inFilter = newValue { false / true }
    /*var filters = [
        {
            field: 'year',
            values: [ 1996, 2010 , 2011 , 2012 ]
        } ,
        {
            field: 'keywords',
            fieldType: 'set',
            values: ['Fourier' , 'Web' , 'information' ]
        }
    ];
    */
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
            clipping.metadata = metadataCache[url];
            clipping.mmd = repo.mmds.acm_portal;
            RendererBase.addMetadataDisplay(content , url , clipping , MICE.render, options);
        }
    });
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
    //Util.arrayToSet(graph);
    //return graph;
    //  /*
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
    // */
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
applyFilter();

function renderLoop() {
    requestAnimationFrame(renderLoop);
    localGraphRenderer.render();
    globalGraphRenderer.render();
}
//start();

window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);

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