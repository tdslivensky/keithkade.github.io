/*global MetadataLoader, console, setInterval, clearInterval*/

var RequestMaster = {};
var SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";
var RequestQueue = [];
var requestInterval = false;


RequestMaster.makeRequest = function(url, callback, reload){
    var serviceURL; 
    RequestQueue.push({url: url, callback: callback, reload: reload});
    clearInterval(requestInterval);
    requestInterval = setInterval(RequestMaster.dequeue, 800);
};

RequestMaster.dequeue = function(){
    if (RequestQueue.length === 0){
        clearInterval(requestInterval);
        return;
    }
    
    var requestObj = RequestQueue.pop();

    MetadataLoader.getMetadata(requestObj.url, requestObj.callback, requestObj.reload);

    //console.log("requesting semantics service for metadata: " + requestObj.url);
};

RequestMaster.empty = function(){
    RequestQueue = [];
};