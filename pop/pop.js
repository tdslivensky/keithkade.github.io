/* jshint browser:true, devel:true */

function pop(){

	var dest = "http://google.com";

	//specify popunder window features
	var features = "width=800,height=510,toolbar=0,location=0,menubar=0";

	var win2 = window.open(dest, "_blank", features);
	win2.blur();
	window.focus();
}