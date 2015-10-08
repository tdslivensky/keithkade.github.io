/*global THREE, window, doc, scene, renderer, axes */

/**
 * Returns a random number between min (inclusive) and max (exclusive). 
 * Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
var Util = {};

/** uniformily distributed random numbers  */
Util.getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
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

/************* THREE.js boilerplate *************/

var panelWidth = 300;
if (window.innerWidth < 700){ //so it can look ok on mobile
    panelWidth = 0;
}
var SCENE_WIDTH = window.innerWidth - panelWidth; //430 is width of options panel
var SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 

var FIELD_OF_VIEW = 45;
var ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

var Boiler = {};

/** create the renderer and add it to the scene */
Boiler.initRenderer = function(){
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xeeeeee , 1); 
    renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    renderer.sortObjects = false; //helps. doesn't fix transparency issues fully though
    doc.getElementById('webgl-container').appendChild(renderer.domElement);
    return renderer;
};

/** create the camera and add it to the scene */
Boiler.initCamera = function(){    
    var camera = new THREE.PerspectiveCamera( FIELD_OF_VIEW, ASPECT, NEAR, FAR);

    camera.position.set(0, 40, 100);

    camera.lookAt(new THREE.Vector3(0,0,0)); //we want to focus on the center 
    
    scene.add(camera);
    
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    return camera;
};
    
/** create the point light and add it to the scene */
Boiler.initLight = function(){
    var pointLight = new THREE.PointLight(0x0000FF); // blue
    pointLight.position.set (10, 10, 300);

    scene.add(pointLight);
    return pointLight;
};

/** draw x, y and z axes */
Boiler.initAxes = function(){
    var length = 100;
    var axes = new THREE.Object3D();
    
    //lines
    axes.add(Boiler.initLine(new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0), 0xff0000)); // X 
    axes.add(Boiler.initLine(new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0), 0x00ff00)); // Y
    axes.add(Boiler.initLine(new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length), 0x0000ff)); // Z
    
    //labels
    axes.add(Boiler.initLabel('X','#ff0000', [25, 0, 0]));
    axes.add(Boiler.initLabel('Y','#00ff00', [0, 25, 0]));
    axes.add(Boiler.initLabel('Z','#0000ff', [0, 0, 25]));
    
    scene.add(axes);
    return axes;
};

/** Create a line that goes between the two points of the given color*/
Boiler.initLine = function(v1, v2, col){
    var material = new THREE.LineBasicMaterial({ color: col });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    var line = new THREE.Line(geometry, material);
    return line;
};

Boiler.toggleAxes = function(elem){
    if (elem.checked){
        scene.add(axes);
    }
    else {
        scene.remove(axes);
    }
};

/** Creates a canvas with the given text then renders that as a sprite. Original: http://stackoverflow.com/questions/14103986/canvas-and-spritematerial */
Boiler.initLabel = function(text, color, coords){

    var canvas = doc.createElement('canvas');
    var size = 300;
    canvas.width = size;
    canvas.height = size;
    
    var context = canvas.getContext('2d');
    context.textAlign = 'center';
    context.fillStyle = color;
    context.font = '90px Helvetica';
    context.fillText(text, size/2, size/2);

    var amap = new THREE.Texture(canvas);
    amap.needsUpdate = true;
    amap.minFilter = THREE.LinearFilter;

    var mat = new THREE.SpriteMaterial({
        map: amap,
        color: 0xffffff     
    });

    var sprite = new THREE.Sprite(mat);
    sprite.scale.set( 10, 10, 1 ); 
    sprite.position.set(coords[0], coords[1], coords[2]);
    return sprite;  
    
};

Boiler.drawPoint = function(x){
    var material = new THREE.SpriteMaterial( {
        color: 0x333333
    });

    var sprite = new THREE.Sprite(material);
    sprite.scale.set( 5, 5, 1 ); 
    sprite.position.set(x.x, x.y, x.z);
    scene.add(sprite);
};