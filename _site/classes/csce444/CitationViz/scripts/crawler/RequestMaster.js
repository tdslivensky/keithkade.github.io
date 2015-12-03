/*global console, setInterval, clearInterval, BSAutoSwitch */

/**
 *	We keep requests in a queue that is emptied on a timer to avoid flooding the service
 */

var RequestMaster = {};
var RequestQueue = [];
var requestInterval = false;

var bsService = new BSAutoSwitch(['elkanacmmmdgbnhdjopfdeafchmhecbf']);

/**
 * Add a new request to the queue
 * @param {String} url
 * @param {Function} callback
 * @param {Boolean} reload, forces service to reload instead of use cached
 * @param {Boolean} isCrawl, if this is for the crawler, we make requests at much slower speeds
 */
RequestMaster.makeRequest = function(url, callback, reload){
    var serviceURL; 
    RequestQueue.push({url: url, callback: callback, reload: reload});
    clearInterval(requestInterval);
    requestInterval = setInterval(RequestMaster.dequeue, 6000);
};

/**
 * Remove the next request from the queue and send it to the service
 */
RequestMaster.dequeue = function(){
    if (RequestQueue.length === 0){
        clearInterval(requestInterval);
        return;
    }
    
    var requestObj = RequestQueue.shift();

    bsService.loadMetadata(requestObj.url, {}, requestObj.callback);
};

/**
 * Remove all outstanding requests
 */
RequestMaster.empty = function(){
    RequestQueue = [];
};