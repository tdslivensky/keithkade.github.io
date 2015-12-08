/* global document, THREE, RenderUtil, event */

function GraphRenderer( graphNodeMap , keyArray, simulator , canvasName ) {
    var container = document.getElementById(canvasName);
    var canvas;
    var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x555558, 1); 
    
    // Create a new Three.js scene
    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x505050));
    scene.data = this;
    // Put in a camera at a good default location
    var camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 10000);
    camera.position.set(0, 0, 100); // TODO pick your favoirte starting position!!!!
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);
    this.cameraControls = new THREE.TrackballControls( camera, renderer.domElement );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, 1, 0 );
    scene.add( directionalLight );

    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set( 0, -1, 0 );
    scene.add( directionalLight );
    // Create a root object to contain all other scene objects
    var root = new THREE.Object3D();
    scene.add(root);
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.canvas = canvas;
    this.container = container;
    this.simulator = simulator;
    this.objects = [];
    this.keyArray = keyArray;
    this.loadObjects(graphNodeMap);
}

GraphRenderer.prototype.loadObjects = function(graphNodeMap) {
    for ( var key in graphNodeMap ) {
        var node = graphNodeMap[key];
        var object = this.createObject( node );
        this.objects.push(object);
    }
};

GraphRenderer.prototype.createObject = function(node) {
    var object = this.createSphereObject(node);
    this.scene.add( object );

    var titleObj = this.createTitleObject(node);
    this.scene.add( titleObj );
    object.titleObj = titleObj;
    object.node = node;
    return object;
};

GraphRenderer.prototype.createSphereObject= function(node) {
    var geometry = new THREE.SphereGeometry(0.8, 16, 16);
    var material = new THREE.MeshPhongMaterial( { color: 0xFF00FF } );
    var sphere = new THREE.Mesh( geometry, material );
    return sphere;
};

GraphRenderer.prototype.createTitleObject = function(node) {
    var spritey = RenderUtil.makeTextSprite( node.title, { fontsize: 40, fontface: "Helvetica" } );
    return spritey;
};

GraphRenderer.prototype.render = function() {
    this.updateObjectPositions();
    this.renderer.render(this.scene, this.camera);
    //var delta = this.clock.getDelta(); // Time since last call in seconds
    this.cameraControls.update(0.1);
};


GraphRenderer.prototype.updateObjectPositions = function() {
    var state = this.simulator.getState();
    for ( var i = 0; i < this.keyArray.length; i++) {
        var newPos = state[i];
        this.objects[i].position.copy(newPos);
        var camPos = this.camera.position.clone();
        var vector = camPos.sub(this.objects[i].position).normalize();
        // TODO this could be played with some
        this.objects[i].titleObj.position.copy(newPos.clone().add(vector.multiplyScalar(1.2).sub(this.camera.up.clone().multiplyScalar(0.5))));

        if ( this.objects[i].node.inFilter ) {
            this.objects[i].visible = true;
            this.objects[i].titleObj.visible = true;
        } else {
            this.objects[i].visible = false;
            this.objects[i].titleObj.visible = false;
        }


    }
};


GraphRenderer.prototype.getClickedObjects = function(mouseEvent) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x =   ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse , this.camera);
    var complexObjects = raycaster.intersectObjects(this.scene.children);
    var justNodes = [];
    for ( var o in complexObjects) {
        var cO = complexObjects[o];
        if ( cO.object && cO.object.node) {
            justNodes.push( cO.object.node);
        }
    }
    return justNodes;
};
