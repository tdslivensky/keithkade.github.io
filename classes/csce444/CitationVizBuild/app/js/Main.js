/* jshint -W004, browser: true, devel: true */
/* global doc, UI, Simulator, GraphRenderer, Util, BSAutoSwitch, MICE, nodeData, RendererBase, metadataCache, RepoMan, Filter, simpl, Set */

var App = {};
var mmd;
var bookmarkDiv = doc.getElementById('selected-nodes');

//Bound to UI sliders
App.physicsVars = {
	sharedKeyword : {attract : 1, repulse: 1},
	sharedClassification : {attract : 1, repulse: 1},
	sharedAuthor : {attract : 1, repulse: 1},
	citedByOrReferenced : {attract : 1, repulse: 1}
};

// GraphNode Maps and metadata Maps
var metadataMap = getMetaDataMap();
var globalGraphNodeMap = getGlobalGraphNodeMap();
var globalGraphNodeKeyArray = Util.keyArray(globalGraphNodeMap);

var globalSimulator = new Simulator(globalGraphNodeMap , globalGraphNodeKeyArray);
var globalGraphRenderer = new GraphRenderer(globalGraphNodeMap , globalGraphNodeKeyArray, globalSimulator , 'explore-graph');

var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-keyword-sliders'), 'Shared Keyword', App.physicsVars.sharedKeyword, onUserInput, globalGraphRenderer.toggleKeyWordEdges.bind(globalGraphRenderer));
var sharedAuthorSliders = new UI.PhysicSliders(doc.getElementById('shared-author-sliders'), 'Shared Author', App.physicsVars.sharedAuthor, onUserInput, globalGraphRenderer.toggleAuthorEdges.bind(globalGraphRenderer));
var citedBySliders = new UI.PhysicSliders(doc.getElementById('cited-sliders'), 'Cited by / Referenced', App.physicsVars.citedByOrReferenced, onUserInput, globalGraphRenderer.toggleCitationEdges.bind(globalGraphRenderer));

var yearFilterSlider = new UI.FilterSlider(doc.getElementById('year-filter'), 'Year', globalGraphNodeMap, 'year', onUserInput);
var countFilterSlider = new UI.FilterSlider(doc.getElementById('citation-count-filter'), 'Citation Count', globalGraphNodeMap, 'citation_count', onUserInput);

var keywordFilter = new UI.FilterDropdown(doc.getElementById('keyword-filter'), 'Keywords', globalGraphNodeMap, 'sharedKeyWordPeeps', onUserInput);

applyFilter();
requestAnimationFrame(renderLoop); // Start request animation frame that tells simulator to sim and graphRenderer to render
globalSimulator.start();
initUserInputEvents();
instantiateMmd();

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
    var min = parseFloat(yearFilterSlider.lVal);
    var max = parseFloat(yearFilterSlider.rVal);
    var yearFilter = {
        field: 'year',
        values: rangeList(min,  max)
    };
    filters.push(yearFilter);

    // Citation filter
    min = parseFloat(countFilterSlider.lVal);
    max = parseFloat(countFilterSlider.rVal);
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
        fieldType: 'object',
        values: keywords
    };
	filters.push(keyWordsFilter);

    Filter(globalGraphNodeMap , filters);    
}

function getMetaDataMap() {
	if (metadataCache) {
		return metadataCache;
	} else {
		console.log("No metadataCache");
	}
}

function getGlobalGraphNodeMap() {
	if (nodeData) {
		Util.arrayToSet(nodeData);
		return nodeData;
	} else {
		console.log("No globalGraphNodeMap");
	}
}

function renderLoop() {
    requestAnimationFrame(renderLoop);
    globalGraphRenderer.render();
}

// ==================================================================== Load up the mmd of acm portal
function instantiateMmd() {
    var request = new XMLHttpRequest();
    request.onload = function(e){
        mmd = JSON.parse(request.response);
        simpl.graphExpand(mmd);
    };
    request.open('GET', 'http://ecology-service.cs.tamu.edu/BigSemanticsService/mmd.json?name=acm_portal');
    request.send();
}

// ==================================================================== User Input Handlers
function initUserInputEvents() {
	
	function keydown(event){
    	//if (event.keyCode == 17 || event.keyCode == 91 || event.keyCode == 93){
		if (event.keyCode == 90){
			doc.getElementById('settings-panel').style.display = 'block';
    	}  
	}
	function keyup(event){
		if (event.keyCode == 90){
			doc.getElementById('settings-panel').style.display = 'none';
		}      
	}
	window.addEventListener("keydown", keydown, false);
	window.addEventListener("keyup", keyup, false);
	
	globalGraphRenderer.renderer.domElement.addEventListener("dblclick", function(event)  {
        var objects = globalGraphRenderer.getClickedObjects(event);

        if ( objects && objects.length > 0 ) {
            var node = objects[0];
            if (event.shiftKey){
                addBookmark(node);
            }
            focusOnNode(node);
			var i = globalGraphNodeKeyArray.indexOf(node.id);
            var nodePos = globalSimulator.getState()[i];
			var avg = globalGraphRenderer.camera.position.clone().multiplyScalar(2);
			avg.add(nodePos);
			avg.multiplyScalar(0.333);
            Util.setOverTime(globalGraphRenderer.cameraControls.target, nodePos, 500, 50);
            Util.setOverTime(globalGraphRenderer.camera.position, avg, 500, 50);
        }
    });
	
    // Add mouse click handlers for both canvas
    globalGraphRenderer.renderer.domElement.addEventListener( 'mousedown' , function(event)  {
        var objects = globalGraphRenderer.getClickedObjects(event);

        if ( objects && objects.length > 0 ) {
            var node = objects[0];
            if (event.shiftKey){
                addBookmark(node);
            }
            focusOnNode(node);
        }
    });
}

function focusOnNode(node){
    var clipping = {
        metadata : metadataMap[node.id],
        mmd : mmd
    };
    RendererBase.addMetadataDisplay(document.getElementById("mice"), '', clipping , MICE.render, {});
    globalGraphRenderer.markAsMice(node);    
}
    

// ==================================================================== Bookmarks
var bookmarks = new Set();
function addBookmark(node){
    if (bookmarks.has(node.id)){
        return;
    }
    else {
        bookmarks.add(node.id);
        var elem = new UI.Bookmark(node);
        bookmarkDiv.appendChild(elem);
        elem.onclick = function(){
            var i = globalGraphNodeKeyArray.indexOf(node.id);
            var nodePos = globalSimulator.getState()[i];
            Util.setOverTime(globalGraphRenderer.cameraControls.target, nodePos, 500, 50);
            focusOnNode(node);
        };
    }
}
                                                             