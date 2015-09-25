/**
 * Returns a random number between min (inclusive) and max (exclusive). 
 * Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
var Util = {};

Util.getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};

/** Strangely, Sylvester doesn't have a magnitude function */
Util.magnitude = function(v){
    var sum = 0;
    for (var i = 0; i < v.elements.length; i++){
        sum += Math.pow(v.elements[i], 2);
    }
    return Math.sqrt(sum);
};

