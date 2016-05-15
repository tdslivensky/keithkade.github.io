/**
 * Returns a random number between min (inclusive) and max (exclusive). 
 * Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
var Util = {};

/** uniformily distributed random numbers  */
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

/** Euclidean distance between points */
Util.dist = function(x1, x2){
    var sum = 0;
    for (var i = 0; i < x1.elements.length; i++){
        sum += Math.pow(x1.elements[i] - x2.elements[i], 2);
    }
    return Math.sqrt(sum);
};

// Source: http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};