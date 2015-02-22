/*global setInterval, XMLHttpRequest, FormData, MetadataLoader, MONA*/

var Logger = {};

Logger.queue = [];

var MILLIS_BETWEEN_LOG = 2000;

var LOGGING_SERVICE = "https://ideamache.ecologylab.net/i/event_log/";

function getCurrentUTCMilliTime()
{
	var d =  new Date();
	return d.getTime() + (d.getTimezoneOffset()*60*1000)/1000;
}

function Operation(name, eventObj, timestamp)
{
	this.name = name;
	
	this.eventObj = eventObj;
	
	this.timestamp = timestamp;
	
	// add timestamp to eventObj	
	for(var i in this.eventObj)
	{
		this.eventObj[i].timestamp = this.timestamp;
		break;
	}
}

Logger.init = function(userid, cond)
{
    
    MetadataLoader.logger = Logger.recordMONAOperation;
	
	Logger.hash_key = userid;
	
	if (cond != "none")
		Logger.username = cond + "_mona";
	
	setInterval(Logger.checkLogEvents, MILLIS_BETWEEN_LOG);
};

Logger.recordMONAOperation = function(eventObj)
{
	var op = new Operation("MONA Operation", eventObj, getCurrentUTCMilliTime());
	
	Logger.queue.push(op);
};

Logger.emptyLogQueue = function()
{
	var logMessage = {
		log_post: {
			hash_key: Logger.hash_key,
			username: Logger.username,
			app: "MONA",
			events: this.translateQueue()
		}
	};
	
	return logMessage;
};

Logger.translateQueue = function()
{
	var events = [];
	
	for(var i = 0; i < this.queue.length; i++)
	{
		var q = this.queue[i];
		events.push(q.eventObj);
	}
	this.oldQueue = this.queue;
	this.queue = [];
	
	return events;
};

Logger.clearLogQueue = function()
{
	this.oldQueue = [];
};

Logger.dontClearLogQueue = function()
{
	for(var i = 0; i < this.oldQueue.length; i++)
	{
		this.queue.push(this.oldQueue[i]);
	}
	this.oldQueue = [];
};

Logger.logEvents = function(logMessage)
{
	var fd = new FormData();
	fd.append("events_json ", JSON.stringify(logMessage));
		 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", LOGGING_SERVICE);
	xhr.onload = function()
	{
		if(xhr.statusText == "OK")
		{
	   		//console.log("Logging Successful");
			Logger.clearLogQueue();
	   	}	   		
	   	else
	   	{
	   		//console.log("Logging Failed");
	   		Logger.dontClearLogQueue();
	   	}	
	   		
	};
	xhr.send(fd);
};

Logger.checkLogEvents = function()
{
	if(Logger.queue.length > 0)
		Logger.logEvents(Logger.emptyLogQueue());
};

Logger.init("shamwowza", "kade");
