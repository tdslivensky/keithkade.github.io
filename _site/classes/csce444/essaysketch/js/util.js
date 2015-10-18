/* Util */

var Util = {};

//give a list of html elements, delete all their children
Util.deleteChildren = function() {
    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        while (element.firstChild){
            element.removeChild(element.firstChild);
        }
    }
};

/** uniformily distributed random numbers  */
Util.getRandom = function (min, max) {
    return Math.random() * (max - min) + min;
};

/** Gets random entry from array  */
Util.getRandomEntry = function (arr) {
    var index = Math.floor(Util.getRandom(0, arr.length + 0.99));
    return arr[index];
};