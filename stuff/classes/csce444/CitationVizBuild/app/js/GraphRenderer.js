/* jshint -W004, browser: true, devel: true */
/* global THREE, RenderUtil, nodeData */

function GraphRenderer( graphNodeMap , keyArray, simulator , canvasName ) {
    var container = document.getElementById(canvasName);
    var canvas;
    var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x222222, 1);
    
    // Create a new Three.js scene
    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x444444));
    scene.data = this;
    // Put in a camera at a good default location
    var camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 10000);
    camera.position.set(40, 40, 100);
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(camera);
    //this.cameraControls = new THREE.TrackballControls( camera, renderer.domElement );
    this.cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
    this.cameraControls.target.set(26, 25, 25); // the center of the graph
	
    //this.cameraControls.target.set(0,0,0);
    var directionalLight = new THREE.DirectionalLight( 0xcccccc, 0.6 );
    directionalLight.position.set( 0, 1, 0 );
    scene.add( directionalLight );

    directionalLight = new THREE.DirectionalLight( 0xcccccc, 0.6 );
    directionalLight.position.set( 0, 0, 1 );
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
    this.authorLines = [];
    this.citationLines = [];
    this.keywordLines = [];
    this.showAuthorLines = true;
    this.showCitationLines = true;
    this.showKeyWordLines = true;
    this.keyArray = keyArray;
    this.loadObjects(graphNodeMap);
    this.clock = new THREE.Clock();
}

GraphRenderer.prototype.loadObjects = function(graphNodeMap) {
    for ( var key in graphNodeMap ) {
        var node = graphNodeMap[key];
        var object = this.createObject( node );
        object.edges = [];
        this.objects.push(object);

    }

    this.makeAuthorRelationLines(graphNodeMap);
    this.makeCitationRelationLines(graphNodeMap);
    this.makeKeyWordRelationLines(graphNodeMap);
};

GraphRenderer.prototype.makeAuthorRelationLines = function(graphNodeMap) {
    var lineMap = {};
    var that = this;
    for ( var i = 0; i < this.objects.length; i++) {
        var object = this.objects[i];
        var Id = object.node.id;
        object.node.sharedAuthorPeeps.forEach(function(elem) {
            var otherId   = parseInt(elem);
            var otherNode = graphNodeMap[otherId];
            var key = Id + ' '  + otherId;
            if (otherNode && !lineMap[key]) {
                var otherObject = otherNode.renderObject;
                var material = new THREE.LineBasicMaterial({ color: 0xc8e600 ,transparent:true });
                material.opacity = 0.2;
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
                var line = new THREE.Line( geometry, material );
                line.beginPoint = object;
                line.endPoint   = otherObject;
                lineMap[Id + ' ' + otherId] = true;
                lineMap[otherId + ' ' + Id] = true;

                that.authorLines.push(line);
                that.scene.add( line );
                object.edges.push(line);
                otherObject.edges.push(line);
            }
        });
    }
};

GraphRenderer.prototype.makeCitationRelationLines = function(graphNodeMap) {
    var that = this;
    var lineMap = {};
    for ( var i = 0; i < this.objects.length; i++) {
        var object = this.objects[i];
        var Id = object.node.id;
        object.node.citations.forEach(function(elem) {
            var otherId   = parseInt(elem);
            var otherNode = graphNodeMap[otherId];
            var key = Id + ' '  + otherId;
            if (otherNode && !lineMap[key]) {
                var otherObject = otherNode.renderObject;

                var material = new THREE.LineBasicMaterial({ color: 0x00c8e6 ,transparent:true });
                material.opacity = 0.2;
                var geometry = new THREE.Geometry();
                geometry.vertices.push( new THREE.Vector3(0,0,0),  new THREE.Vector3(0,0,0) );
                var line = new THREE.Line( geometry, material );
                line.beginPoint = object;
                line.endPoint   = otherObject;
                lineMap[Id + ' ' + otherId] = true;
                lineMap[otherId + ' ' + Id] = true;
                that.citationLines.push(line);
                that.scene.add( line );
                object.edges.push(line);
                otherObject.edges.push(line);
            }
        });
    }
};

GraphRenderer.prototype.makeKeyWordRelationLines = function(graphNodeMap) {
    var that = this;
    var lineMap = {};
    for ( var i = 0; i < this.objects.length; i++) {
        var object = this.objects[i];
        var Id = object.node.id;
        var idMap = {}; // Only add a line if for this obj the id isnt used
        for ( var keyword in object.node.sharedKeyWordPeeps ) {
            var peepSet = object.node.sharedKeyWordPeeps[keyword];
            peepSet.forEach( function(elem) {
                var otherId = parseInt(elem);
                if ( !idMap[otherId] ) {
                    idMap[otherId] = true;
                    var otherNode = graphNodeMap[otherId];
                    var key = Id + ' ' + otherId;
                    if (otherNode && !lineMap[key]) {
                        var otherObject = otherNode.renderObject;
                        var material = new THREE.LineBasicMaterial({color: 0xFF00FF ,transparent:true });
                        material.opacity = 0.2;
                        var geometry = new THREE.Geometry();
                        geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
                        var line = new THREE.Line(geometry, material);
                        line.beginPoint = object;
                        line.endPoint = otherObject;
                        lineMap[Id + ' ' + otherId] = true;
                        lineMap[otherId + ' ' + Id] = true;
                        that.keywordLines.push(line);
                        that.scene.add(line);
                        object.edges.push(line);
                        otherObject.edges.push(line);
                    }
                }
            });
        }
    }
};

GraphRenderer.prototype.createObject = function(node) {
    var object = this.createSphereObject(node);
    this.scene.add( object );

    var titleObj = this.createTitleObject(node);
    this.scene.add( titleObj );
    object.titleObj = titleObj;
    object.node = node;
    node.renderObject = object;
    return object;
};

GraphRenderer.prototype.createSphereObject= function(node) {
    var geometry = new THREE.SphereGeometry(0.8, 16, 16);
    var material = new THREE.MeshPhongMaterial( { color: 0x738f56 } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.normalMaterial = material;
    return sphere;
};

GraphRenderer.prototype.createTitleObject = function(node) {
    var maxLength = 100;
    var titleString = node.title;
    if ( node.title.length > maxLength ) {
        titleString = titleString.substr(0 , maxLength) + "...";
    }
    var spritey = RenderUtil.makeTextSprite( titleString, { fontsize: 40, fontface: "Helvetica" } );
    return spritey;
};

GraphRenderer.prototype.render = function() {
    this.updateObjectPositions();
    this.renderer.render(this.scene, this.camera);
    var delta = this.clock.getDelta();
    this.cameraControls.update(delta);
};

GraphRenderer.prototype.updateObjectPositions = function() {
    var state = this.simulator.getState();
    for ( var i = 0; i < this.keyArray.length; i++) {
        var newPos = state[i];
        this.objects[i].position.copy(newPos);
        var camPos = this.camera.position.clone();
        var vector = camPos.sub(this.objects[i].position).normalize();
        this.objects[i].titleObj.position.copy(newPos.clone().add(vector.multiplyScalar(1.4).sub(this.camera.up.clone().multiplyScalar(0.5))));

        if ( this.objects[i].node.inFilter ){
            this.objects[i].visible = true;
        } else {
            this.objects[i].visible = false;
        }
		
		if (this.objects[i].visible && this.objects[i].inFrustum) {
            this.objects[i].titleObj.visible = true;
		}
		else {
			this.objects[i].titleObj.visible = false;
		}
    }

    // Update lines
    this.updateLines( this.authorLines , new THREE.Vector3(0,0,0) , this.showAuthorLines);
    this.updateLines( this.citationLines , new THREE.Vector3(0,0.1,0) , this.showCitationLines);
    this.updateLines( this.keywordLines , new THREE.Vector3(0,-0.1,0) , this.showKeyWordLines);
};

GraphRenderer.prototype.updateLines = function( lines , offsetVector , show) {
    if ( !show ) {
        return;
    }
    for ( var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Should this line be seen?
        if ( line.beginPoint.node.inFilter && line.endPoint.node.inFilter ) {
            line.visible = true;
            var pos1 = line.beginPoint.position.clone().add(offsetVector);
            var pos2 = line.endPoint.position.clone().add(offsetVector);
            line.geometry.vertices[0] = pos1;
            line.geometry.vertices[1] = pos2;
            line.geometry.verticesNeedUpdate = true;
        }
        else {
            line.visible = false;
        }
    }
};

GraphRenderer.prototype.getClickedObjects = function(mouseEvent) {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x =   ( event.layerX / this.container.offsetWidth ) * 2 - 1;
    mouse.y = - ( event.layerY / this.container.offsetHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse , this.camera);
    var complexObjects = raycaster.intersectObjects(this.objects);
    var justNodes = [];
    for ( var o in complexObjects) {
        var cO = complexObjects[o];
        if ( cO.object && cO.object.node) {
            justNodes.push( cO.object.node);
        }
    }
    return justNodes;
};

GraphRenderer.prototype.markAsMice = function(node) {
    if ( this.MiceNode) {
        this.MiceNode.material = this.MiceNode.normalMaterial;
        for ( var i=0; i < this.MiceNode.edges.length; i++) {
            this.MiceNode.edges[i].material.opacity = 0.2;
        }
    }
    var renderObject = node.renderObject;
    renderObject.material = new THREE.MeshPhongMaterial( { color: 0x75da0b});
    for (var i=0; i < renderObject.edges.length; i++) {
        renderObject.edges[i].material.opacity = 1;
    }
    this.MiceNode = renderObject;
};

GraphRenderer.prototype.toggleAuthorEdges = function() {
    this.showAuthorLines = !this.showAuthorLines;
    for ( var i =0; i < this.authorLines.length; i++) {
        this.authorLines[i].visible =  false;
    }
};

GraphRenderer.prototype.toggleKeyWordEdges = function() {
    this.showKeyWordLines = !this.showKeyWordLines;
    for ( var i =0; i < this.keywordLines.length; i++) {
        this.keywordLines[i].visible =  false;
    }
};

GraphRenderer.prototype.toggleCitationEdges = function() {
    this.showCitationLines = !this.showCitationLines;
    for ( var i =0; i < this.citationLines.length; i++) {
        this.citationLines[i].visible =  false;
    }
};

function findTitle(title) {
    var results = [];
    for ( var key in nodeData) {
        var node = nodeData[key];
        var index = node.title.indexOf(title);
        if ( index >= 0)
            results.push(node);
    }
    return results;
}