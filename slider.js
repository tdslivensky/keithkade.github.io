/*global document*/

var toggleSlide = function() {
	var main = document.getElementById('mainContent');
    if (!main.className) {
        main.className = 'slide';
    } else {
        main.className = '';
    }
	var btn = document.getElementById('navButton');
    if (!btn.className) {
        btn.className = 'out';
    } else {
        btn.className = '';
    }    
};