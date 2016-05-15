/* jshint -W004, browser: true, devel: true */
/* global Set */

var doc = document; //shorthand

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

//for array of vector 3
Array.prototype.clone = function() { 
    var newArr = [];
    for (var i = 0; i < this.length; i++){
        newArr[i] = this[i].clone();
    }
    return newArr; 
};

Array.prototype.copy = function(arr) { 
    for (var i = 0; i < this.length; i++){
        this[i].copy(arr[i]);
    }
};

Array.prototype.add = function(state) {
    if ( !state)
        return;
    for (var i = 0; i < state.length; i++){
        this[i].add(state[i]);
    }
};

Array.prototype.multiply = function(x) {
    for (var i = 0; i < this.length; i++){
        this[i].multiplyScalar(x);
    }
};
//

var Util = {};

/** uniformily distributed random numbers  */
Util.getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};

Util.arrayToSet = function (graph) {
    for (var key1 in graph){
        var node = graph[key1];
        for (var key2 in node){
            if ( Array.isArray(node[key2])){
                node[key2] = new Set(node[key2]);
            }
            else if (typeof node[key2] === 'object'){
                var obj = node[key2];
                for (var key3 in obj){
                    if ( Array.isArray(obj[key3]))
                        obj[key3] = new Set(obj[key3]);
                }
            }
        }
    }
};

Util.keyArray = function(map) {
    var array = [];
    for( var key in map) {
        array.push(key);
    }
    return array;
};

Util.getXYValsFromGraph = function(graph, attr){
    var x = [];
    var y = [];
    var counts = {};
    for (var id in graph){
        var node = graph[id];
        var val = node[attr];
        
        //currently excludes if value is null
        if (!val) continue;
        
        if (val in counts){
            counts[val] += 1;
        }
        else {
            counts[val] = 1;
        }
    }
    
    for (var value in counts){
        x.push(value);
    }
    x.sort(function(a, b){return a-b;});
    
    for (var i = 0; i < x.length; i++){
        y.push(counts[x[i]]);
    }
    
    return {x:x, y:y};
};

Util.getFilterableList = function(graphData, attr){
	var filterables = new Set();
	for (var id in graphData){
		
		var node = graphData[id];
		var x = 10;
		for (var key in node[attr]){
			filterables.add(key);
		}
		
	}
	return Array.from(filterables).sort();
};

Util.removeDuplicates = function(edgelist){
	edgelist.citedByOrReferenced = edgelist.citedByOrReferenced.reduce(function(accum, current) {
		var index = accum.indexOfTuple(current);
		if (index < 0) {
			accum.push(current);
		}
		return accum;
	}, []);
	edgelist.sharedAuthor = edgelist.sharedAuthor.reduce(function(accum, current) {
		var index = accum.indexOfTuple(current);
		if (index < 0) {
			accum.push(current);
		}
		return accum;
	}, []);
	edgelist.sharedKeyword = edgelist.sharedKeyword.reduce(function(accum, current) {
		var index = accum.indexOfTuple(current);
		if (index < 0) {
			accum.push(current);
		}
		return accum;
	}, []);	
};

Util.setOverTime = function(target, newTarget, time, steps){
    var dx = (newTarget.x - target.x) / steps;
    var dy = (newTarget.y - target.y) / steps;
    var dz = (newTarget.z - target.z) / steps;
    var wait = time / steps;
    
    var i = 0;
    function step(){
        i++;
        target.set(target.x + dx, target.y + dy, target.z + dz);
        if (i <= steps){
            setTimeout(step, wait);
        }
    }

    step();
};

Array.prototype.indexOfTuple = function(tuple){
    for(var i = 0; i < this.length; i++) {
        if (this[i].equalsTupleArr(tuple)) return i;
    }
    return -1;
};

Array.prototype.equalsTupleArr = function(arr){
    if (this.length !== arr.length)
        return false;
    for(var i = 0; i < this.length; i++) {
        if (this[i] !== arr[i]) 
            return false;
    }
    return true;
};