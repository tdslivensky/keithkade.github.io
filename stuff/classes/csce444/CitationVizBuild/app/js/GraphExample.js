/* jshint -W004, browser: true, devel: true */
/* global renderer:true, THREE, scene:true, camera:true */

var gv;
var gv2;
function func() {
    gv  = new GraphViz("explore-graph");
    GraphVizList.push(gv);
    gv2 = new GraphViz("personal-graph");
    GraphVizList.push(gv2);
    render();
}

var GraphVizList = [];
function render() {
    requestAnimationFrame( render );
    for ( var i = 0; i < GraphVizList.length; i++) {
        var gviz = GraphVizList[i];
        gviz.renderer.render(gviz.scene , gviz.camera);
    }
}

function GraphViz(containerName) {
    var container = document.getElementById(containerName);
    var canvas;
    renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x7EC0EE, 1);
    // Create a new Three.js scene
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x505050));
    scene.data = this;
    // Put in a camera at a good default location
    camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 10000);
    camera.position.set(0, 0, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    //this.cameraControls = new THREE.TrackballControls(camera, renderer.domElement);
    scene.add(camera);
    // Create a root object to contain all other scene objects
    var root = new THREE.Object3D();
    scene.add(root);

    var count = Math.floor(Math.random() * 5);
    for ( var i =0; i < count; i++) {
        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
        var cube = new THREE.Mesh( geometry, material );
        scene.add( cube );
        cube.position.set( i  , 0,0);
    }

    camera.position.z = 5;
    var that = this;
    renderer.domElement.addEventListener( 'mousedown', function(event) {
        event.preventDefault();
        var clickedObjects = that.getClickedObjects(event);
        console.log(clickedObjects);
    }, false );
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.canvas = canvas;
    this.container = container;
}

GraphViz.prototype.getClickedObjects = function(mouseEvent) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x =   ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse , this.camera);
    return raycaster.intersectObjects(this.scene.children);
};
