/* global document, Set */

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

//for array of vector 3
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
                    obj[key3] = new Set(obj[key3]);
                }
            }
        }
    }
};