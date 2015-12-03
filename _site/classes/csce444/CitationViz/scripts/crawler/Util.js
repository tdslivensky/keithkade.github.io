/* global document*/
var Util = {};
var doc = document;

/**
 * This class is returned by Util.getExplorables. 
 * It contains the neccesary data to make a node
 * You don't always want to make a new node for each explorable.
 * Might grow up to be a node one day.
 * @constructor
 * @param {String} type
 * @param {String} title
 * @param {String} url 
 * @param {String} mmdName
 */
var Explorable = function(type, title, url, mmdName){
	this.type = type;
	this.title = title;
	this.url = url;
	this.mmdName = mmdName;
};

/**
 * determine whether a metadata field is explorable. only returns acm articles
 * @param {MetadataField}
 */
Util.isExplorable = function(field){
	if (!(field instanceof Array))
		return false;
	
	for (var i in field){

		if (field[i].hasOwnProperty('navigatesTo')) 
            return true;
		
		for (var j in field[i].value){
			if (field[i].value[j].hasOwnProperty('navigatesTo')) 
                return true;
			
			for (var k in field[i].value[j].value){
				if (field[i].value[j].value[k].hasOwnProperty('navigatesTo')) 
					return true;
				}
		}
	}
	return false;
};

Util.unwrapMD = function(md){
    var unwrapped = md;
    
	//unwrap the metadata if needed
	if (unwrapped.metadata){
		unwrapped = unwrapped.metadata;
	}
	
    //unwrap more if needed
    if (!unwrapped.meta_metadata_name && !unwrapped.mm_name){
        var type = Object.keys(unwrapped)[0];
        unwrapped = unwrapped[type];
        unwrapped.mm_name = type;
    }
    
    return unwrapped;
};

/** 
 * find every explorable nested in a metadata object
 * @param {Object} md 
 * @returns {Object} the explorables, with url as key
 */
Util.getExplorables = function(md){
	var explorables = {};
    
    var possibleAttr = ["meta_metadata_name", "mm_name"];
    for (var k=0; k < possibleAttr.length; k++){
        
        var mmKey = possibleAttr[k];
        
        for (var key in md){
            var exp, curObj, firstMD, mmdName;
            var currentField = md[key];
            if (currentField instanceof Array && currentField[0] instanceof Object){
                firstMD = currentField[0];
                if (firstMD.hasOwnProperty(mmKey)){
                    if (firstMD[mmKey] != "rich_document" && firstMD[mmKey] != "image"){
                        for (var i = 0;  i < currentField.length; i++){
                            curObj = currentField[i];
                            if ("title" in curObj && "location" in curObj && curObj[mmKey] == 'acm_portal'){
                                exp = new Explorable(key, curObj.title, curObj.location, curObj[mmKey]);
                                explorables[curObj.location] = exp;
                            }
                        }
                    }
                }
                else {
                    for (var key2 in currentField[0]){
                        firstMD = currentField[0][key2];
                        if (firstMD.hasOwnProperty(mmKey)){
                            if (firstMD[mmKey] != "rich_document" && firstMD[mmKey] != "image"){			
                                for (var j = 0;  j < currentField.length; j++){
                                    curObj = currentField[j][key2];
                                    if ("title" in curObj && "location" in curObj && curObj[mmKey] == 'acm_portal'){
                                        exp = new Explorable(key, curObj.title, curObj.location, curObj[mmKey]);
                                        explorables[curObj.location] = exp;
                                    }
                                }			
                            }
                        }
                    }
                }
            }
            else if (currentField instanceof Object){
                if (currentField.hasOwnProperty(mmKey) && "location" in currentField && "title" in currentField){
                    if (currentField[mmKey] != "rich_document" && currentField[mmKey] != "image" && key !== "source" && currentField[mmKey]  == 'acm_portal'){
                        exp = new Explorable(key, currentField.title, currentField.location, currentField[mmKey]);
                        explorables[currentField.location] = exp;
                    }
                }
            }
        }
    }

	return explorables;
};