function GraphRenderer( graphNodeMap , keyArray, simulator , canvasName ) {
    var container = document.getElementById(canvasName);
    var canvas;
    var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x7EC0EE, 1); // TODO pick your favorite color!
    // Create a new Three.js scene
    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x505050));
    scene.data = this;
    // Put in a camera at a good default location
    var camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 10000);
    camera.position.set(0, 0, 10); // TODO pick your favoirte starting position!!!!
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);
    this.cameraControls = new THREE.TrackballControls( camera, renderer.domElement );
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

function makeTextSprite( message, parameters )
{
    if ( parameters === undefined ) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 4;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

    //var spriteAlignment = THREE.SpriteAlignment.topLeft;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    // background color
    context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
        + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";

    context.fillText( message, borderThickness, fontsize + borderThickness);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas)
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture} );
    var sprite = new THREE.Sprite( spriteMaterial );
    //sprite.scale.set(1,1,1.0);
    return sprite;
}
// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r)
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

GraphRenderer.prototype.loadObjects = function(graphNodeMap) {
    for ( var key in graphNodeMap ) {
        var node = graphNodeMap[key];
        var object = this.createObject( node );
        this.scene.add( object );
        object.position.set( Math.random() * 5 -2.5 , Math.random() * 5 -2.5 ,Math.random() * 5- 2.5);
        var spritey = makeTextSprite( " World! ", { fontsize: 32, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
        spritey.position.clone(object.position);
        //this.scene.add( spritey );
        this.objects.push(object);
    }
};

GraphRenderer.prototype.createObject = function() {
    var geometry = new THREE.SphereGeometry( 1, 32,32 );
    var material = new THREE.MeshBasicMaterial( { color: 0x000000 } ); // TODO set sphere color
    var sphere = new THREE.Mesh( geometry, material );



    return sphere;
};

GraphRenderer.prototype.render = function() {
    this.updateObjectPositions();
    this.renderer.render(this.scene, this.camera);
    //var delta = this.clock.getDelta(); // Time since last call in seconds
    this.cameraControls.update(.1);
};


GraphRenderer.prototype.updateObjectPositions = function() {
    var state = this.simulator.getState();
    for ( var i = 0; i < this.keyArray.length; i++) {
        var newPos = state[i];
        this.objects[i].position.copy(newPos);
    }
};

GraphViz.prototype.getClickedObjects = function(mouseEvent) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x =   ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse , this.camera);
    return raycaster.intersectObjects(this.scene.children);
};
