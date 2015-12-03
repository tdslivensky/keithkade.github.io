/*jshint -W004*/
/*global THREE, window, doc, scene, renderer, axes*/

/**
 * Returns a random number between min (inclusive) and max (exclusive). 
 * Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
var Util = {};

function State(){
    this.x = new THREE.Vector3(0,0,0);      //position              X
    this.q = new THREE.Quaternion();        //rotation quaternion   q
    this.P = new THREE.Vector3(0,0,0);      //linear momentum.      P = m*v
    this.L = new THREE.Vector3(0,0,0);      //angular momentum.     L = I*w
}

State.prototype.copy = function(state){
    this.x.copy(state.x);
    this.q.copy(state.q);
    this.P.copy(state.P);
    this.L.copy(state.L);
};

State.prototype.add = function(state){
    this.x.add(state.x);
    this.q.set(this.q.x + state.q.x, this.q.y + state.q.y, this.q.z + state.q.z, this.q.w + state.q.w);
    this.P.add(state.P);
    this.L.add(state.L);
};

State.prototype.multScalar = function(scalar){
    this.x.multiplyScalar(scalar);
    this.q.set(this.q.x * scalar, this.q.y * scalar, this.q.z * scalar, this.q.w * scalar);
    this.P.multiplyScalar(scalar);
    this.L.multiplyScalar(scalar);
};

/** uniformily distributed random numbers  */
Util.getRandom = function (min, max) {
  return Math.random() * (max - min) + min;
};


Util.sortTwo = function(tuple){
    if (tuple[0] <= tuple[1])
        return tuple;
    else 
        return [tuple[1], tuple[0]];
};

/** 
 * add a list of unique edges to a mesh 
 * inefficient, but only runs once
 */
Util.addEdges = function(mesh){
    var edges = [];
    
    for (var j = 0; j < mesh.geometry.faces.length; j++){
        var face = mesh.geometry.faces[j];
        edges.push(Util.sortTwo([face.a, face.b]));
        edges.push(Util.sortTwo([face.a, face.c]));        
        edges.push(Util.sortTwo([face.b, face.c]));
    }
    
    mesh.edges = edges.uniqueEdges();
};

/** removes duplicates from array */
Array.prototype.uniqueEdges = function() {
    return this.reduce(function(accum, current) {
        var index = accum.indexOfTuple(current);
        if (index < 0) {
            accum.push(current);
        }
        return accum;
    }, []);
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

// Source: http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
/** Converts from degrees to radians. */
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
/** Converts from radians to degrees. */
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

Util.addMatrix4 = function(mat1, mat2){
  for (var i = 0; i < mat1.elements.length; i++){
      mat1.elements[i] += mat2.elements[i];
  }  
    
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
    scene.add(camera);        
    return camera;
};
    
/** create the point light and add it to the scene */
Boiler.initLight = function(){
    var pointLight = new THREE.PointLight(0x0000FF); // blue
    pointLight.position.set (10, 10, 300);

    scene.add(pointLight);
    return pointLight;
};

/** the object that bass will bounce off of. */
Boiler.initCube = function(cubeAttr){
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshNormalMaterial( /* { wireframe: true } */ );
    var cube = new THREE.Mesh( geometry, material );
        
    cube.position.set(cubeAttr.p[0], cubeAttr.p[1], cubeAttr.p[2]);

    for (var i = 0; i < cube.geometry.vertices.length; i++) {
        //scale the mesh
        cube.geometry.vertices[i].x *= cubeAttr.scale;
        cube.geometry.vertices[i].y *= cubeAttr.scale;
        cube.geometry.vertices[i].z *= cubeAttr.scale;
    }
    
    cube.geometry.applyMatrix(
        new THREE.Matrix4().makeRotationFromEuler(
            new THREE.Euler( cubeAttr.r[0], cubeAttr.r[1], cubeAttr.r[2])
        )
    );

    scene.add(cube);
    return cube;
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
    
    //scene.add(axes);
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
    sprite.scale.set( 1, 1, 1 ); 
    sprite.position.set(x.x, x.y, x.z);
    scene.add(sprite);
};