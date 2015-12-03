/* global indexedDB, console, RequestMaster, Util */

var PreCrawl = {};
var MaxDepth = 0;
var URLCount = {};
var URLDepth = {};
var stopped = false;
var MAX_NODES = 200;
var START_URL = 'http://dl.acm.org/citation.cfm?preflayout=flat&id=2557273';
var targetedCrawls = {};
var targetDone = {};    //if a targetted crawl has been performmed on a url store it here in case we see it again. 

var metadataCache = {};

//initialize the indexedDB
var openRequest = indexedDB.open("CitationVizDB",1);
var db;

/**
 * This creates the db if it doesnt already exist
 */
openRequest.onupgradeneeded = function(e) {
	console.log("Setting up indexedDB");
	var thisDB = e.target.result;
 
	if(!thisDB.objectStoreNames.contains("MD")) {
		thisDB.createObjectStore("MD");
	}
};

/**
 * Loads the metadata from the db into local memory and then begins the crawl for more. 
 */
openRequest.onsuccess = function(e) {
	console.log("db good to go");
	db = e.target.result;
	
	var objectStore = db.transaction("MD").objectStore("MD");
  
	var count = 0;
	objectStore.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;
	  	if (cursor) {
            URLCount[cursor.key] = 1;
			
            metadataCache[cursor.key] = cursor.value;
            
			//the browser can crash if we load too many
			count++;
			if (count % 100 === 0){
				console.log("loaded " + count);
			}
			cursor.continue();
	  	}
	  	else {
			console.log("loaded up local cache");
	  		PreCrawl.crawl(START_URL, 4);
		}
	};      
	
};

openRequest.onerror = function(e) {
	console.log("Error");
	console.dir(e);
};

/**
 * add metadata object to indexedDB using url as key
 */
function addMD(md, loc) { 
    var transaction = db.transaction(["MD"],"readwrite");
    var store = transaction.objectStore("MD");
 
    //Perform the add
    var request = store.add(md,loc);
 
    request.onerror = function(e) {
        console.log("Error",e.target.error.name);
    };
 
    request.onsuccess = function(e) {
        console.log("Woot! Added to db");
    };
}

/**
 * logs the size of the db in both mb and entries
 */
function getDBSize(){
 	var size = 0;
	var entries = 0;
	
	var objectStore = db.transaction("MD").objectStore("MD");

	objectStore.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;
	  	if (cursor) {
		  	var storedObject = cursor.value;
			//objects can be circular now so cannot stringify them
            var json = JSON.stringify(storedObject);
            size += json.length;
			entries++;
            cursor.continue();
	  	}
	  	else {
			console.log("Database size = " + size/1048576 + " mb");
			console.log("Entries = " + entries);
	  	}
	};    
}

/////////////////////////////// Crawling Code

/**
 * Start with a url and a depth of 0
 */
PreCrawl.crawl = function(url, depth){
    MaxDepth = depth;
    request(url, 0);
};

/**
 * External command to stop the crawling
 */
PreCrawl.stop = function(){
    stopped = true;
	RequestMaster.empty();
};

/**
 * recursively removes all the download_status and additional_location in a md since they are not used by Mona
 */
function trimExt(md){
	if (md instanceof Array){
		for (var i=0; i<md.length; i++){
			trimExt(md[i]);
		}
	}
	else if (md instanceof Object){
		for (var key in md){
			if (key == "download_status" || key == "additional_locations"){
				delete md[key];	
			}
			else if (md[key] instanceof Array || md[key] instanceof Object){
				trimExt(md[key]);
			}
		}
	}
}
/**
 * We recursively crawl level by level. If we hit a url that has over MAX_NODES connections, 
 * we only go deeper on the MAX_NODES with the most connections. 
 */
function smartCrawl(md, depth){
    var loc = md.location;
    var type = md.meta_metadata_name;
    var waitingFor = false;
    var key;
    var waitKeys = [];

    // targetCrawls are the urls that have over 70 connections
    for (key in targetedCrawls){
        if(loc in targetedCrawls[key].kidsSet){
            waitingFor = true;
            waitKeys.push(key);
        }
    }
    
    // the location is one that we were waiting for in one of the targeted crawls 
    if (waitingFor){
        for (var k in waitKeys){
            key = waitKeys[k];
            //we always want to continue our crawl with the authors so we just give them a huge count 
            if (type == "acm_portal_author"){
                targetedCrawls[key].kidsList.push([1000, loc]);
            }
            else if (type == "acm_portal"){
                if ("citations" in md)
                    targetedCrawls[key].kidsList.push([md.citations.length, loc]);
                else 
                    targetedCrawls[key].kidsList.push([0, loc]);
            }
            else {
                targetedCrawls[key].kidsList.push([0, loc]);
            }
            delete targetedCrawls[key].kidsSet[loc];
            //In case of failed requests I say the length only needs to be within 2. kind of cludge
            if (Object.keys(targetedCrawls[key].kidsSet).length <= 2){
                targetedCrawls[key].kidsList.sort(function(a, b) {
                  return b[0] - a[0];
                });
                var importantLinks = targetedCrawls[key].kidsList.slice(0, MAX_NODES+1);
                delete targetedCrawls[key];
                targetDone[key] = true;
                for (var i in importantLinks){
                    request(importantLinks[i][1], URLDepth[key]+1);
                }
            }
        }
    }
    else {
        if (depth+1 > MaxDepth)
            return;
            
        var explorables = Util.getExplorables(md);

        if (Object.keys(explorables).length > MAX_NODES) {
            var url = md.location;

            //if we are already doing a or have already done a targeted crawl for this url just return
            if (url in targetedCrawls || url in targetDone){
                explorables = {};
            }

            targetedCrawls[url] = {};
            targetedCrawls[url].kidsList = [];
            targetedCrawls[url].kidsSet = {};
            for (var o in explorables){
                targetedCrawls[url].kidsSet[o] = true;
            }
        }
        
        for (var e in explorables){
            request(e, depth+1);
        }
    }
}


function request(url, depth){    
    if (depth > MaxDepth || stopped) 
		return;
    
    //if we havent seen this url before set its depth
    if (!URLDepth[url]){
        URLDepth[url] = depth;
    }
    
	//key has been requested. don't request again. 
    if (url in URLCount){
        URLCount[url] += 1;	
        
        if (url in metadataCache){
            smartCrawl(metadataCache[url], depth);
        }
	}
	else {
		URLCount[url] = 1;
		RequestMaster.makeRequest(url, crawlResponse, false, true);
	}
}

function crawlResponse(err, md, requestMmd){
	if (stopped) 
		return;
	else if (err){
		console.log(err);
		return;
	}
	
    md = Util.unwrapMD(md);
    
    var loc = md.location;
	trimExt(md);

	addMD(md, loc);
    metadataCache[loc] = md;

    var depth = URLDepth[loc];
	
    smartCrawl(md, depth);
}
