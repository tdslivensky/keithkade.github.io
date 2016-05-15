/* jshint -W004, browser: true, devel: true */
/* global THREE */

var RenderUtil = {};

/* magic numbers up in here for scaling. maybe figue out what is going on later */
RenderUtil.makeTextSprite = function(message , parameters) {
    if ( parameters === undefined ) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ? parameters.fontface : "Arial";
    var fontsize = parameters.hasOwnProperty("fontsize") ? parameters.fontsize : 8;
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters.backgroundColor : { r:50, g:50, b:50, a:0.9 };
	
    var canvas = document.createElement('canvas');
    canvas.width = 2000;
    var context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    var l = message.length / 100 * canvas.width;
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
    RenderUtil.roundRect(context , canvas.width / 2 - (l /2 ) , 0 , l , 50 , 25);

    // text color
    context.fillStyle = "rgba(225, 225, 225, 1)";
    context.textAlign = "center";
    context.fillText(message, canvas.width / 2, fontsize);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture} );
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(10, 1, 1);
    return sprite;
};

// function for drawing rounded rectangles
RenderUtil.roundRect = function(ctx, x, y, w, h, r) {
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
};