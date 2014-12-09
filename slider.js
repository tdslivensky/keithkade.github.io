/*global document */

var toggleSlide = function() {
	var main = document.getElementById('mainContent');
    if (!main.className) {
        main.className = 'slide';
    } else {
        main.className = '';
    }
};