/*global window, doc, Image, fixWhiteSpace, rgbToRgbObj, getLabel, simplDeserialize, waitForNewMMD, MDC_rawMMD, getNodes, allNodeMDLoaded, document, setTimeout, MetadataLoader, console, hexToRgb, FlairMaster, sortNumber, median, MDC_rawMetadata, showMetadata, setInterval, clearInterval, Vector, getRandomArbitrary, doPhysical, graphWidth:true, graphHeight:true, primaryNodes:true, secondaryNodes:true, renderedNodesList:true, secondaryNodesList:true, nodePositions:true, drawSecondaryNodes, updateAllLines, Heap, deleteChildren, setCentroid, typePositions:true, stopPhysical, alert, focusHistory, updateLinePos, RequestMaster, $*/

var MONA = {},
    cachedMD = "",     //the old in focus metadata. used to compare against current in focus metadata
    focusTitle = "",    //the title of the in focus node. used to avoid creating copy of focus node in graph area
    focusUrl = "",      //the url of the in focus node. used to avoid creating copy of focus node in graph area
    nodeColors = {},    //maps node type to a color
    isTypeShown = {},   //whether each type is expanded
    nodeMetadata = {},  //maps node location to that node's metatata
    nodeMetadataCache = {}, //all the metadata that has been loaded
    pageMidHeight,      //the pixel vertical center of the page. used to center MICE/the graph area
    colorCount = 0,     //number of colors we have used. used to index clorArray
    COLOR_ARRAY = ["#009933", "#006699", "#cc7e00", "#cc003f", "#60c"], 
    requestsMade = 0,   //number of requests for metadata made
    T4_SIZE = 15,       //image sizes in pixels
    T3_SIZE = 20,
    T2_SIZE = 25,       //also the base size
    T1_SIZE = 30,
    NUM_STEPS = 100,    //number of iterations of grapher algorithm
    renderInterval = false,     //the rendering interval for nodes.
    historyNodes = [],  //list of nodes display in history
    historyNodeSet = {},//set of nodes displayed in history
    alreadyRendered = {}, //nodes that were already displayed as a part of the previous monad
    unrenderedNodesHeap,//prior to being drawn, nodes are stored here. sorted by number of parents
    GRAPH_ELEM,         //the html element of the graph area
    TYPE_ELEM,          //the html element of the type area
    HISTORY_ELEM,       //the html element of the history area
    LOAD_BAR_ELEM,      //the html element of the loading bar/spinner
    STATUS_ELEM,
    LINE_ELEM,          //the html element (svg) that we draw lines on 
	MICE_ELEM,
    MAX_NODES = 70,     //max number of nodes we want to render
    nodesDrawn = false,
    SERVICE_LOGS_URL = "http://ecology-service.cse.tamu.edu:8082/admin/find-logs.json";

MONA.graphPaused = false;

function Node(type, title, location, mmdName, parent){
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0, 30) + "...";
	this.location = location;
	this.mmdName = mmdName;
    this.children = [];
    
    if (parent !== null){
        this.parents = [parent];
        this.x = 600;
        this.y = parent.y + getRandomArbitrary(-2, 2);
    }
    else {
        this.parents = [];
        this.x = 120;
        this.y = pageMidHeight;          
    }
    this.rendered = false;
}

//rev your engines
MONA.initialize = function (){
    //define our global html elements
    GRAPH_ELEM = document.getElementById("graphArea");
    TYPE_ELEM = document.getElementById("typeArea");
    LOAD_BAR_ELEM = document.getElementById("loadingBar");
    HISTORY_ELEM = document.getElementById("historyArea");
    LINE_ELEM = document.getElementById("lineSVG"); 
    STATUS_ELEM = document.getElementById("status");
    
    graphWidth = GRAPH_ELEM.getClientRects()[0].width;
	graphHeight = GRAPH_ELEM.getClientRects()[0].height;
	
    LINE_ELEM.style.width = graphWidth+550;
	LINE_ELEM.style.height = graphHeight;
    
    pageMidHeight = graphHeight/2;
    setCentroid();
    
    MICE_ELEM = document.getElementById("monaMice");
    MICE_ELEM.style.top = pageMidHeight + "px";
    TYPE_ELEM.style.top = pageMidHeight + "px";
    var histHeight = pageMidHeight - 70;
    HISTORY_ELEM.style.height = histHeight + "px";
    
    MONA.reFocus();
};

function focusClick(){
    nodesDrawn = false;
    var miceElem = document.getElementById("mdcIce");
    deleteChildren(miceElem);
    MONA.reFocus();
}

MONA.reFocus = function(mdLoaded){
    if (document.getElementById("nodesLoading")) MICE_ELEM.removeChild(document.getElementById("nodesLoading"));
	
    nodePositions = {};
    
	colorCount = 0;
    clearInterval(renderInterval);
    renderInterval = false;
    
    var nodesLoading = document.createElement('div');
    nodesLoading.style.top = (pageMidHeight - 6) + "px";
    nodesLoading.style.fontSize = "16px";
	nodesLoading.id = "nodesLoading";
	MICE_ELEM.appendChild(nodesLoading);
    
    var spinner = new Image(24,24);
    spinner.src = "img/spinner.gif";
    nodesLoading.appendChild(spinner);
	
    var loadingTxt = document.createElement('p');
    loadingTxt.innerHTML = "Loading Focus Node...";
    loadingTxt.style.margin = "2px 0px 0px 35px";
    nodesLoading.appendChild(loadingTxt);
    
    document.getElementById("pause").checked = false;
	
	if (!mdLoaded){
		nodeMetadata = {};  
		deleteChildren(GRAPH_ELEM, TYPE_ELEM, LOAD_BAR_ELEM, LINE_ELEM);
		renderedNodesList = [];
		waitForNewMMD();
	}
    
    waitForMICE();
    showMetadata();
};

function smartMerge(node){
		var key;
		for (key in nodeMetadata){
			if (primaryNodes[key] === undefined)
				delete nodeMetadata[key];    
		}
		
        var newRenderedNodesList = [];
        var newAlreadyRendered = {};
    
		var renderedNodes = GRAPH_ELEM.childNodes;
		for (var i=0; i<renderedNodesList.length; i++){
			var renderedNode = renderedNodesList[i];
			if (primaryNodes[renderedNode.location] === undefined || renderedNode.location === "undefined"){
				var x = GRAPH_ELEM.removeChild(renderedNode.visual);
			}
            else {
                newRenderedNodesList.push(renderedNode);
                newAlreadyRendered[renderedNode.location] = renderedNode;
            }
		}
	
        renderedNodesList = newRenderedNodesList;
        alreadyRendered = newAlreadyRendered;
    
		deleteChildren(LINE_ELEM);

		MONA.reFocus(true);
		waitForNewMMD();
}

function onNodeClick(location, type){
    
    if (location == focusUrl){
        alert("That is the node you are currently focused on");
        return;
    }
    
    if (MetadataLoader.logger){
		var eventObj = {node_click: { url: location, type: type}};
        if (type == 'graph' && location in primaryNodes){
            eventObj.node_click.type = 'primary';
        }
        else if (type == 'graph') {
            eventObj.node_click.type = 'secondary';
        }
		MetadataLoader.logger(eventObj);
	}
    
    nodesDrawn = false;
	
    var node = primaryNodes[location];
	if (node) unHighlightNode(node);
    else unHighlightNode(secondaryNodes[location]);
    
	MONA.graphPaused = true;
    stopPhysical();
	
	document.getElementById("targetURL").value = location;
    var miceElem = document.getElementById("mdcIce");
    deleteChildren(miceElem);
    
    if (nodeMetadataCache.hasOwnProperty(focusUrl)){
        addToHistory(nodeMetadataCache[focusUrl]);
    }
    	
    var newMD = nodeMetadata[location];
	var nodeLoaded = (newMD !== undefined);
	//if we alrady have MD for the clicked node be smart about what we delete
	if (!nodeLoaded){
        clearInterval(renderInterval);
        renderInterval = false;
		setTimeout(MONA.reFocus, 300, false);
	}
	else{
        deleteChildren(TYPE_ELEM, LOAD_BAR_ELEM);		
		getNodes(newMD);
	}
	
	for (var i in renderedNodesList){
        var rNode = renderedNodesList[i];
		if (primaryNodes[rNode.location] === undefined || !nodeLoaded){
			rNode.visual.style.webkitTransform = "translate(-550px, "+graphHeight/2+"px)";
		}
	}
	
	if(nodeLoaded){
		setTimeout(smartMerge, 250, node);
	}

    for (var j in historyNodes){
        unHighlightNode(historyNodes[i], true);
    }
}

function backClick(){
    if (historyNodes.length < 1){
        alert("No history to go back to");
        return;
    }
    document.getElementById("targetURL").value = historyNodes[historyNodes.length-1].location;
    if (nodeMetadataCache.hasOwnProperty(focusUrl)){
        addToHistory(nodeMetadataCache[focusUrl]);
    }
    stopPhysical();
    renderedNodesList = [];
    alreadyRendered = {};
    var miceElem = document.getElementById("mdcIce");
    deleteChildren(miceElem);
    nodesDrawn = false;
    MONA.reFocus();
}

//waits until the new metadata comes in before updating the nodes
function waitForNewMMD(){
    if (MDC_rawMetadata === "" || (cachedMD !== "" && MDC_rawMetadata[Object.keys(MDC_rawMetadata)[0]].location == cachedMD[Object.keys(cachedMD)[0]].location)){
        setTimeout(waitForNewMMD, 100);
        return;
    }
    cachedMD = MDC_rawMetadata;
    if (document.getElementById("nodesLoading")) MICE_ELEM.removeChild(document.getElementById("nodesLoading"));
        
    if (!nodesDrawn) getNodes(MDC_rawMetadata);
}

function waitForMICE(){
    var miceTitle = document.getElementsByClassName("fieldValue metadata_h1")[0];
    if (!miceTitle){
        setTimeout(waitForMICE, 200);
        return;
    }    
    miceTitle.addEventListener("click", onMiceClick);//(\"" + miceTitle.href + "\")");
}

function onMiceClick(event){
	alert("HODOR");	
    if (MetadataLoader.logger){
		var eventObj = {mice_title_click: { url: event.target.href}};
		MetadataLoader.logger(eventObj);
	}
}

//make requests for all the node metadata
function populateNodeMetadata(){
    
    deleteChildren(LOAD_BAR_ELEM);
	requestsMade = 0;
    
	//for now don't try to load mmd if there is more than 30. we don't want to kill the service. also do nothing if there are no nodes
	if (Object.keys(primaryNodes).length > MAX_NODES || Object.keys(primaryNodes).length === 0) {
		return;
	}
    
    //make requests for all the first level nodes
	for (var nodeKey in primaryNodes) {
		//If we already have the metadata don't request it again
		if (nodeMetadataCache[nodeKey] !== undefined){
			getSecondaryNodes(nodeMetadataCache[nodeKey], primaryNodes[nodeKey]);
		}
		else{
			RequestMaster.makeRequest(primaryNodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
    
    //start the loading bar
    if (requestsMade > 0){
        var loadingDiv = document.createElement('div');
        loadingDiv.style.marginTop = "10px";

        var spinner = new Image(24,24);
        spinner.src = "img/spinner.gif";
        loadingDiv.appendChild(spinner);

        var loadingTxt = document.createElement('p');
        loadingTxt.innerHTML =  "0 of " + requestsMade + " new node metadata loaded";
        loadingTxt.style.margin = "0px 0px 0px 5px";
        loadingTxt.style.display = "inline";
        loadingTxt.id = "mdLoadingTxt";
        loadingDiv.appendChild(loadingTxt);
        
        LOAD_BAR_ELEM.appendChild(loadingDiv);
    }
    waitForNodeMDLoaded();
}

//update loading bar while we wait on all the node metadata to come in
function waitForNodeMDLoaded(){

    var loading = document.getElementById("mdLoadingTxt");
    if (loading !== null){
        loading.innerHTML= Object.keys(nodeMetadata).length + " of " + requestsMade + " new node metadata loaded";
    }
    
    if (Object.keys(nodeMetadata).length < requestsMade) {
        setTimeout(waitForNodeMDLoaded, 300);
        return;
    }
	allNodeMDLoaded();
}

//store the metadata for a node once it comes in
function storeNodeMD(rawMetadata, requestMmd){
    if (!nodesDrawn)
        return;
	for (var key in rawMetadata){
		//console.log("got some metadata for " + rawMetadata[key].title);
		for (var location in primaryNodes){
            var rawNodeLoc = rawMetadata[key].location;
			if (location !== undefined && (location.indexOf(rawNodeLoc) > -1 || rawNodeLoc.indexOf(location) > -1)){
				nodeMetadata[location] = rawMetadata;
				nodeMetadataCache[location] = rawMetadata;
                nodeMDLoaded(location);
                getSecondaryNodes(rawMetadata, primaryNodes[location]);
			}
		}
	}
}

//when a single node's metadata is loaded update its colors
function nodeMDLoaded(nodeKey){
	var div = document.getElementById(nodeKey);
	if (div === null){
		setTimeout(nodeMDLoaded, 150, nodeKey);
		return;
	}
	var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
}

//when all node metadata is loaded update image sizes and put the secondary nodes into the secondary nodes list
function allNodeMDLoaded(){
    if (LOAD_BAR_ELEM.firstChild) LOAD_BAR_ELEM.removeChild(LOAD_BAR_ELEM.firstChild);
	updateImgSizes("acm_portal");
	updateImgSizes("acm_portal_author");
	updateAllLines();
    for (var nodeKey in secondaryNodes){
        secondaryNodesList.push(secondaryNodes[nodeKey]);
    }
}

//when we navigate add the old one to the history
function addToHistory(md){
    var newNode;
    for (var mmdType in md){
        var mmdObj = md[mmdType];
        //remove extraneous newline characters and spaces
        var trimTitle = mmdObj.title.replace(/(\r\n|\n|\r)/gm," ");
        trimTitle = trimTitle.replace(/\s+/g," ");
        newNode = new Node(mmdType, trimTitle, mmdObj.location, mmdObj.meta_metadata_name, null);
        historyNodes.push(newNode);
        historyNodeSet[newNode.location] = newNode;
    }
    newNode.visual = document.createElement('div');
        
    if (newNode.location !== undefined){
        newNode.visual.style.cursor = "pointer";
		newNode.visual.setAttribute('onclick','onNodeClick("'+newNode.location+'", "history")');
    }
    newNode.visual.setAttribute('onmouseover','onNodeMouseover("'+newNode.location+'")');
    newNode.visual.setAttribute('onmouseout','onNodeMouseout("'+newNode.location+'")');  
    newNode.visual.style.color = "black";
    
    var nodeText = "";
    if(newNode.title.length > 30)
        nodeText = newNode.abbrevTitle;
    else
        nodeText = newNode.title;
    
    var nodePara = document.createElement('p');
    nodePara.innerHTML = nodeText;
    nodePara.className = "nodeText";
    
    //images are preloaded so we make copies of them		
    var img = FlairMaster.getFlairImage(newNode.mmdName).cloneNode(true);
    img.setAttribute('height',T3_SIZE+'px');
    img.setAttribute('width',T3_SIZE+'px');

    newNode.visual.appendChild(img);
    newNode.visual.appendChild(nodePara);
    HISTORY_ELEM.appendChild(newNode.visual);
    setTimeout(focusHistory, 3000);
    fadeHistory();
}

//make history nodes fade out as they reach the bottom
function fadeHistory(){
    for (var i = historyNodes.length - 1; i >= 0; i--){
        var node = historyNodes[i];
        var dist = node.visual.getBoundingClientRect().top - HISTORY_ELEM.offsetTop;

        //ignore the first one since it will be animating
        if (dist > 0 && dist < 100 && historyNodes.length - 1 >= 10){
            var opac = dist*1.5;
            if (opac > 100) opac = 99;
            if (opac < 10) node.visual.style.opacity = '.0' + opac;
            else node.visual.style.opacity = '.' + opac;
        }
        else if (dist < 0 && historyNodes.length - 1 != i){
            node.visual.style.opacity = '.01';
        }
        else{
            node.visual.style.opacity = '1';
        }
    }
}

//make more important nodes bigger
function updateImgSizes(mmdType){
	var citationCountList = [];
	var foundOne = false;
	for (var nodeKey in nodeMetadata){
        var curNode = nodeMetadata[nodeKey];
		if (curNode[mmdType] !== undefined){
			foundOne = true;
			if (mmdType == "acm_portal" && curNode.acm_portal !== undefined && curNode.acm_portal.citations !== undefined){
				citationCountList.push(curNode.acm_portal.citations.length);
			}
			//currently ranks by total citations. up for debate if this is best
			else if (mmdType == "acm_portal_author" && curNode.acm_portal_author.publication_detail.citation_count !== undefined){
				citationCountList.push(parseInt(curNode.acm_portal_author.publication_detail.citation_count));
			}
			else { 
				citationCountList.push(0);
			}
		}
	}
	//if no nodes of mmdType exist, just return
	if (!foundOne) return;
	
    //get the medians 
    citationCountList = citationCountList.sort(sortNumber).reverse();
    console.log(citationCountList);
	var midMedian = median(citationCountList);
	var halfLength = Math.ceil(citationCountList.length / 2);    
	var leftSide = citationCountList.splice(0,halfLength);
	var rightSide = citationCountList;
	var topMedian = median(leftSide);
	var bottomMedian = median(rightSide);
		
	for (nodeKey in primaryNodes){
		if (nodeMetadata.hasOwnProperty(nodeKey) && nodeMetadata[nodeKey][mmdType] !== undefined) {
			var citationCount = 0;
			if (mmdType == "acm_portal"){
				if (nodeMetadata[nodeKey].acm_portal.citations !== undefined) {
					citationCount = nodeMetadata[nodeKey].acm_portal.citations.length;
				}
			}
			else if (mmdType == "acm_portal_author"){
				if (nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count !== undefined){
					citationCount = parseInt(nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count);
				}
			}
			var imgs = document.getElementById(nodeKey).getElementsByTagName('img');
			var img = imgs[0];
			if (citationCount >= topMedian){
				img.setAttribute('height',T1_SIZE+'px');
				img.setAttribute('width',T1_SIZE+'px');
			}
			else if (citationCount < topMedian && citationCount >= midMedian){
				img.setAttribute('height',T2_SIZE+'px');
				img.setAttribute('width',T2_SIZE+'px');
			}
			else if (citationCount < midMedian && citationCount >= bottomMedian){
				img.setAttribute('height',T3_SIZE+'px');
				img.setAttribute('width',T3_SIZE+'px');
			}
			else {
				img.setAttribute('height',T3_SIZE+'px');
				img.setAttribute('width',T3_SIZE+'px');
			}
		}
	}
}

//extract what will be nodes from the focus's metadata
function getNodes(MD){
    RequestMaster.empty();
    STATUS_ELEM.innerHTML = " ";
	primaryNodes = {};
	nodeColors = {};
	typePositions = {};
	secondaryNodes = {};
    secondaryNodesList = [];
	colorCount = 0;
    nodesDrawn = true;    	    	
	unrenderedNodesHeap = new Heap(function(a, b) {
		return b.parents.length - a.parents.length;
	});
	
    for (var metadataType in MD){		
		for (var key in MD[metadataType]){
            //globaly store the title of the in-focus node
            if (key == "title"){
                focusTitle = MD[metadataType][key];
            }
            else if (key == "location"){
                focusUrl = MD[metadataType][key];
            }
            var newNode, curObj, firstMD;
			var currentField = MD[metadataType][key];
			if (currentField instanceof Array && currentField[0] instanceof Object){
                firstMD = currentField[0];
				if ("meta_metadata_name" in firstMD){
					if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
						for (var i = 0;  i < currentField.length; i++){
                            curObj = currentField[i];
							if ("title" in curObj){
                                newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, null);
                                primaryNodes[curObj.location] = newNode;
                            }
						}
					}
				}
				else {
					for (var key2 in currentField[0]){
                        firstMD = currentField[0][key2];
						if ("meta_metadata_name" in firstMD){
							if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){			
								for (var j = 0;  j < currentField.length; j++){
                                    curObj = currentField[j][key2];
                                    if ("title" in curObj){
									   newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, null);
									   primaryNodes[curObj.location] = newNode;
                                    }
								}			
							}
						}
					}
				}
			}
			else if (currentField instanceof Object){
				if ("meta_metadata_name" in currentField && "location" in currentField && "title" in currentField){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
						newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, null);
						primaryNodes[currentField.location] = newNode;
					}
				}
			}
		}
	}
    //don't even render if there are too many nodes
	if (Object.keys(primaryNodes).length > MAX_NODES) {
        STATUS_ELEM.innerHTML = "Showing " + MAX_NODES + " of " + Object.keys(primaryNodes).length + " connections";
        var k = 0;
        for (var node in primaryNodes){
            k++;
            if (k>MAX_NODES){
                delete primaryNodes[node];
            }
        }
	}
    //get the types
    for (var n in primaryNodes){
        var cat = getLabel(primaryNodes[n].type);
        if (!nodeColors.hasOwnProperty(cat)){
            nodeColors[cat] = COLOR_ARRAY[colorCount];
			colorCount++;
        }
    }
    
	drawTypes();
	populateNodeMetadata();
    setTimeout(drawNodes, 300);
	setTimeout(drawLines, 300);
}

//extract what will be secondary nodes from an existing node's metadata
function getSecondaryNodes(nodeMD, parent){
    simplDeserialize(nodeMD);
    for (var metadataType in nodeMD){
		for (var key in nodeMD[metadataType]){
            var newNode, curObj, firstMD;
			var currentField = nodeMD[metadataType][key];
			if (currentField instanceof Array && currentField[0] instanceof Object){
                firstMD = currentField[0];
				if ('meta_metadata_name' in firstMD){
					if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
                        key = getLabel(key);
						for (var i = 0;  i < currentField.length; i++){
                            // we found a valid node!
                            curObj = currentField[i];
                            if (curObj.hasOwnProperty('title') && curObj.title !== focusTitle && focusUrl !== curObj.location){
                                //if the node doesn't already exist create it. 
                                if (!(curObj.location in secondaryNodes) && !(curObj.location in primaryNodes)){
                                    newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, parent);
                                    secondaryNodes[curObj.location] = newNode;
                                    //update the parent nodes list of children
                                    parent.children.push(newNode);
                                }
                                //otherwise update the nodes parents
                                else if (curObj.location in secondaryNodes){
                                    secondaryNodes[currentField[i].location].parents.push(parent);
                                    parent.children.push(secondaryNodes[currentField[i].location]);
                                    unrenderedNodesHeap.updateItem(secondaryNodes[currentField[i].location]);
                                    drawLine(secondaryNodes[currentField[i].location]);
                                }
                            }

						}
					}
				}
				else {
					for (var key2 in currentField[0]){
                        firstMD = currentField[0][key2];
						if ("meta_metadata_name" in firstMD){
							if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
								key = getLabel(key);				
								for (var j = 0;  j < currentField.length; j++){
                                    curObj = currentField[j][key2];
                                    if ("title" in curObj && curObj.title !== focusTitle && focusUrl !== curObj.location){ 
                                        if (!(curObj.location in secondaryNodes) && !(curObj.location in primaryNodes)){
                                            newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, parent);
                                            secondaryNodes[curObj.location] = newNode;
                                            parent.children.push(newNode); 
                                        }
                                        else if (curObj.location in secondaryNodes){
                                            secondaryNodes[curObj.location].parents.push(parent);
                                            parent.children.push(secondaryNodes[curObj.location]);
                                            unrenderedNodesHeap.updateItem(secondaryNodes[curObj.location]);
                                            drawLine(secondaryNodes[curObj.location]);
                                        }
                                    }

                                }			
							}
						}
					}
				}
			}
			if (currentField instanceof Object){
				if ("meta_metadata_name" in currentField && "location" in currentField){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
				        key = getLabel(key);
                        if (currentField.title !== focusTitle && currentField.title != "See all colleagues of this author" && focusUrl !== curObj.location){
                            if (!(currentField.location in secondaryNodes) && !(currentField.location in primaryNodes)){
                                newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, parent);
                                secondaryNodes[currentField.location] = newNode;
                                parent.children.push(newNode);
                            }
                            else if (currentField.location in secondaryNodes){
                                secondaryNodes[currentField.location].parents.push(parent);
                                parent.children.push(secondaryNodes[currentField.location]);
                                unrenderedNodesHeap.updateItem(secondaryNodes[currentField.location]);
                                drawLine(secondaryNodes[currentField.location]);
                            }
                        }
					}
				}
			}
		}
	}	
	drawSecondaryNodes();
}

function onNodeMouseover(nodeKey){
    var nodeSet, node, line, rgb;
    if (historyNodeSet.hasOwnProperty(nodeKey)){
        node = historyNodeSet[nodeKey];
        highlightNode(node, true, historyNodes.length-1);
    }
    if (primaryNodes.hasOwnProperty(nodeKey)) {
        node = primaryNodes[nodeKey];
		if (!node.rendered) return;
        line = document.getElementById(node.location+"Line");
        if(!line) return;
        rgb = hexToRgb(nodeColors[node.type]);
        line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
        highlightNode(node);
    }
    if (secondaryNodes.hasOwnProperty(nodeKey) && secondaryNodes[nodeKey].rendered) {    
        node = secondaryNodes[nodeKey];
        for (var i=0; i<node.parents.length; i++){
            line = document.getElementById(node.parents[i].location+node.location+"Line");
            if (line !== null){
                rgb = rgbToRgbObj(line.style.stroke);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
            }  
        }
        highlightNode(node);
    }
}

function highlightNode(node, isHistory, historyPos){
	if (node === undefined || node.visual === undefined || (!isHistory && nodePositions[node.location] === undefined)) return;

    var nodeDiv = node.visual;
    var pArray = nodeDiv.getElementsByTagName('p');
    var p = pArray[0];
    var imgArray = nodeDiv.getElementsByTagName('img');
    var img = imgArray[0];
    p.style.backgroundColor = nodeDiv.style.color;
    p.style.color = "white";
    p.innerHTML = node.title;
	p.style.fontSize = "18px";
    //fix for offset issue
    if (p.style.width < p.clientWidth + img.clientWidth){
        p.style.width = p.clientWidth + img.clientWidth +'px';
    }
    
	var lines = document.getElementsByClassName(node.location+"Line");
    for (var j=0; j<lines.length; j++){
        var rgb = rgbToRgbObj(lines[j].style.stroke);
        lines[j].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
    }
    //if something changed update the lines
    if (!isHistory && nodePositions[node.location].height != nodeDiv.getBoundingClientRect().height){
        updateAllLines();
    }
    //highlight other occurences of this node in history
    if (isHistory && historyPos >= 0){
        for (var i=historyPos-1; i >= 0; i--){
            if (historyNodes[i].location == node.location)
                highlightNode(historyNodes[i], true, i);
        }
    }
}

function onNodeMouseout(nodeKey){
    var nodeSet, node, line, rgb;
    if (historyNodeSet.hasOwnProperty(nodeKey)){
        node = historyNodeSet[nodeKey];
        unHighlightNode(node, true, historyNodes.length-1);
    }
    if (primaryNodes.hasOwnProperty(nodeKey)) {
        node = primaryNodes[nodeKey];
        line = document.getElementById(node.location+"Line");
		if (line !== null){ 
        	rgb = hexToRgb(nodeColors[node.type]);
        	line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
		}
        unHighlightNode(node);
    }
    if (secondaryNodes.hasOwnProperty(nodeKey) && secondaryNodes[nodeKey].rendered) {    
        node = secondaryNodes[nodeKey];
        for (var i=0; i<node.parents.length; i++){
            line = document.getElementById(node.parents[i].location+node.location+"Line");
            if (line !== null){
                rgb = rgbToRgbObj(line.style.stroke);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
            }
        }
        unHighlightNode(node);
    }
}

function unHighlightNode(node, isHistory, historyPos){
	if (node === undefined || node.visual === undefined || (!isHistory && nodePositions[node.location] === undefined)) return;

    var nodeDiv = node.visual;
    var pArray = nodeDiv.getElementsByTagName('p');
    var p = pArray[0];
    if(node.title.length > 30){
        p.innerHTML = node.abbrevTitle;
    }
    if (isHistory){
        p.style.color = "black";
    }
    else{
        p.style.color = p.style.backgroundColor;
    }
    p.style.backgroundColor = "transparent";
	p.style.fontSize = "12px";
    
    var lines = document.getElementsByClassName(node.location+"Line");
    for (var j=0; j<lines.length; j++){
        var rgb = rgbToRgbObj(lines[j].style.stroke);
        lines[j].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
    }
    //if something changed update the lines
    if (!isHistory && nodePositions[node.location].height != nodeDiv.getBoundingClientRect().height){
        updateAllLines();
    }
    //unhighlight other occurences of this node in history
    if (isHistory && historyPos >= 0){
        for (var i=historyPos-1; i >= 0; i--){
            if (historyNodes[i].location == node.location)
                unHighlightNode(historyNodes[i], true, i);
        }
    }
}

function onTypeMouseover(type){
	var lines = document.getElementsByClassName(type+"Line");
	for (var i=0; i<lines.length; i++){
		var rgb = hexToRgb(nodeColors[type]);
		lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
	}
}

function onTypeMouseout(type){
	var lines = document.getElementsByClassName(type+"Line");
	for (var i=0; i<lines.length; i++){
		var rgb = hexToRgb(nodeColors[type]);
		lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	}
}

function onTypeClick(type){
    var lines = document.getElementsByClassName(type+"Line");
    var typeElem = document.getElementById(type);
    var key, node;
    if (!(type in isTypeShown) || isTypeShown[type] === true){
        isTypeShown[type] = false;
        for (key in primaryNodes){
            node = primaryNodes[key];
            if (node.type == type){
                node.rendered = false;
                recursiveRemove(node);
            }
        }
        var len = lines.length;
        for (var i=0; i<len; i++){
            LINE_ELEM.removeChild(lines[0]);
        }
        typeElem.style.fontWeight = "bold";
    }
    else {
        isTypeShown[type] = true;
        for (key in primaryNodes){
            node = primaryNodes[key];
            if (node.type == type){
                node.rendered = true;
                recursiveAdd(node);
                drawLine(node);
            }
        }
        typeElem.style.fontWeight = "300";
    }
}

function addVisual(node, nodeKey){
    node.visual = document.createElement('div');
    if (primaryNodes.hasOwnProperty(nodeKey)){
        node.y = typePositions[node.type].top;
    }
    
    if (node.location !== undefined){
        node.visual.style.cursor = "pointer";
        node.visual.setAttribute('onclick','onNodeClick("'+node.location+'", "graph")');
    }
    node.visual.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
    node.visual.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');    
    
    node.visual.id = nodeKey;
    node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";

    var nodeText = "";
    if(node.title.length > 30)
        nodeText = node.abbrevTitle;
    else
        nodeText = node.title;
    var nodePara = document.createElement('p');
    nodePara.innerHTML = nodeText;
    nodePara.className = "nodeText";

    setColor(node);
    
    var img = FlairMaster.getFlairImage(node.mmdName).cloneNode(true);
    img.setAttribute('height',T2_SIZE+'px');
    img.setAttribute('width',T2_SIZE+'px');

    node.visual.appendChild(img);
    node.visual.appendChild(nodePara);
}

function setColor(node){
    for (var nodeType in nodeColors){
        if (node.type == nodeType){
            node.visual.className=nodeType;
            var rgb = hexToRgb(nodeColors[nodeType]);
            if (nodeMetadataCache[node.location] === undefined){
                node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
            }
            else {
                node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
            }
        }
    }  
    //if color is not defined make it black
    if (node.visual.style.color === ""){
        node.visual.style.color = "rgba(" + 0 + "," + 0 + "," + 0 + ",.5)";
    }
}

//create divs for first layer of nodes
function drawNodes(){
	for (var nodeKey in primaryNodes){
        var node = primaryNodes[nodeKey];	
        if (!(nodeKey in alreadyRendered)) {
            if (document.getElementById(nodeKey) !== null) GRAPH_ELEM.removeChild(document.getElementById(nodeKey));      
            node = primaryNodes[nodeKey];
            addVisual(node, nodeKey);
            GRAPH_ELEM.appendChild(node.visual);
            node.rendered = true;
            renderedNodesList.push(node);
        }
        else {
            node = alreadyRendered[nodeKey];
            node.parents = [];
            setColor(node);
            node.type = primaryNodes[nodeKey].type;
            node.children = primaryNodes[nodeKey].children;
            node.parents = primaryNodes[nodeKey].parents;
            primaryNodes[nodeKey] = node;
        }
		nodePositions[nodeKey] = node.visual.getBoundingClientRect();
        if (node.visual.getBoundingClientRect().left === 0){
            console.log("something went wrong");
        }
	}
    doPhysical(NUM_STEPS);
}

//create divs for second layer of nodes
function drawSecondaryNodes(){  
	for (var nodeKey in secondaryNodes){
        var node = secondaryNodes[nodeKey];
        if (node.visual === undefined){            
            addVisual(node, nodeKey);
            unrenderedNodesHeap.push(node);
        }
	}
    if (renderInterval === false){
        renderInterval = setInterval(renderNode, 2000);
    }
}

function renderNode(){
    if (unrenderedNodesHeap.size() > 0 && renderedNodesList.length < MAX_NODES){    
        var node = unrenderedNodesHeap.pop();
        node.rendered = true;
        renderedNodesList.push(node);
        
        if (node.parents.length > 0){
            node.y = node.parents[0].y + getRandomArbitrary(-2,2);
            node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";
        }
        
        GRAPH_ELEM.appendChild(node.visual);
        nodePositions[node.location] = node.visual.getBoundingClientRect();
        if (node.visual.getBoundingClientRect().left === 0){
            console.log("something went wrong");
        }
        drawLine(node);
    }
    else {
        clearInterval(renderInterval);
    }
    doPhysical(NUM_STEPS);
}

function drawTypes(){
	for (var nodeType in nodeColors){
		var div = document.createElement('div');
		div.setAttribute('onmouseover','onTypeMouseover("'+nodeType+'")');
		div.setAttribute('onmouseout','onTypeMouseout("'+nodeType+'")');
		div.setAttribute('onclick','onTypeClick("'+nodeType+'")');
        div.innerHTML = nodeType;
		div.className=nodeType;
		div.id=nodeType;
		div.style.color = nodeColors[nodeType];
        div.style.cursor = "pointer";
		div.style.textAlign = "right";
		TYPE_ELEM.appendChild(div);
	}
	var children = TYPE_ELEM.children;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		typePositions[child.id] = child.getBoundingClientRect();	
	}

}

function drawLines(){
	for (var nodeKey in primaryNodes){
		drawLine(primaryNodes[nodeKey]);
	}	
}

//draws lines for one newly rendered or updated node
function drawLine(node){
    if (node.rendered){
        drawRelativeLines(node, node.children, false);
        drawRelativeLines(node, node.parents, true);
        if (node.location in primaryNodes){
            var nodeKey = node.location;
            var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);

            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line'); 
            var hoverDetect = document.createElementNS('http://www.w3.org/2000/svg', 'line'); 
            
            var x1 = nodePositions[nodeKey].left+5,
                x2 = typePositions[primaryNodes[nodeKey].type].right+2,
                y1 = nodePositions[nodeKey].top+nodePositions[nodeKey].height/2,
                y2 = typePositions[primaryNodes[nodeKey].type].top+10;
            
            if (x1 === 0 || y1 === 0 || x2 === 0 || y2 === 0 ){
                console.log("something is up");
                return;
            }
            
            hoverDetect.style.zIndex = 4;
            hoverDetect.setAttribute('id', primaryNodes[nodeKey].location+"LineHover");
            hoverDetect.setAttribute('onmouseover','onNodeMouseover("'+node.location+'")');
            hoverDetect.setAttribute('onmouseout','onNodeMouseout("'+node.location+'")');
            hoverDetect.setAttribute('onclick','onNodeClick("'+node.location+'", "line")');
            hoverDetect.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0)";
            hoverDetect.setAttribute('stroke-width', 10);
            LINE_ELEM.appendChild(hoverDetect);
            
            line.setAttribute('class', primaryNodes[nodeKey].type+"Line");
            line.setAttribute('id', primaryNodes[nodeKey].location+"Line");
            updateLinePos(line, x1, y1, x2, y2);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
            line.setAttribute('stroke-width', 1);
            LINE_ELEM.appendChild(line);
        }	
    }
}

//draws either parent on child lines
function drawRelativeLines(node, relatives, isParents){  
        for (var i in relatives){
            var relative = relatives[i];
            if (secondaryNodes[node.location] !== undefined && relative.rendered && document.getElementById(node.location+relative.location+"Line") === null && document.getElementById(relative.location+node.location+"Line") === null){
                var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

                //line ids are in the form parent.location+child.location+"Line"
                if (isParents){
                    line.setAttribute('id', relative.location+node.location+"Line");
                    line.setAttribute('class', relative.location+"Line");
                }
                else {
                    line.setAttribute('id', node.location+relative.location+"Line");
                    line.setAttribute('class', node.location+"Line");
                }
                line.setAttribute('x1', nodePositions[relative.location].left+5);
                line.setAttribute('x2', nodePositions[node.location].left+2);
                line.setAttribute('y1', nodePositions[relative.location].top+nodePositions[relative.location].height/2);
                line.setAttribute('y2', nodePositions[node.location].top+nodePositions[node.location].height/2);
                var rgb = hexToRgb(nodeColors[relative.type]);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
                line.setAttribute('stroke-width', 1);
                LINE_ELEM.appendChild(line);
            }
        }	
}

//removes children and lines of a node
function recursiveRemove(node){
    collapseToType(node, node.type);
    for (var k in node.children){
        var child = node.children[k];
        var line = document.getElementById(node.location + child.location + "Line");
        if (line !== null)  LINE_ELEM.removeChild(line);
        
        //if a node has more than one type of rendered parent keep it
        var remove = true;
        for (var p in child.parents){
            var parent = child.parents[p];
            if (parent.rendered && parent.type !== node.type){
                remove = false;
            }
        }
        
        if (remove && child.rendered){
            child.rendered = false;
            collapseToType(child, node.type);
        }
    }
}

//adds children and lines of a node
function recursiveAdd(node){
    node.visual.style.display = 'block';
    if (MONA.graphPaused) node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)"; 
    for (var k in node.children){
        var child = node.children[k];
        //if the child has never been rendered don't show it now
        if (nodePositions[child.location] === undefined) continue;

        child.rendered = true;
        child.visual.style.display = "block";
        if (MONA.graphPaused) child.visual.style.webkitTransform = "translate("+child.x+"px, "+child.y+"px)";
        drawLine(child);
    }
}

function collapseToType(node, type){
    var typePos = typePositions[type];
    var nodePos = nodePositions[node.location];
    var x = node.x + (typePos.right - nodePos.left);
    var y = node.y + (typePos.top - nodePos.top);
    node.visual.style.webkitTransform = "translate("+x+"px, "+y+"px)";
    //important that the timeout is slower than the css transition speed
    setTimeout(hideNode, 200, node);
}

function hideNode(node){
    node.visual.style.display = 'none';
}

function pauseClick(cb) {
    if (cb.checked){
        MONA.graphPaused = true;
        clearInterval(renderInterval);
        stopPhysical();
    }
    else{
        MONA.graphPaused = false;
        renderInterval = setInterval(renderNode, 2000);
        doPhysical(NUM_STEPS);
    }    
}
