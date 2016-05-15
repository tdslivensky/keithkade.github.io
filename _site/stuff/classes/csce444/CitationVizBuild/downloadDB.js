// server.js
var express = require('express');
var app = express();
var fs  = require('fs');
var server = require('http').createServer(app);
var io = require('socket.io')(server);


app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

app.get('');

server.listen(4200 , '0.0.0.0');

io.on('connection', function(client) {
    console.log("I was connected to");
    client.emit("connect" , {});
    client.on('metadataCache' , function(data) {
        // Save data
        fs.appendFile('metadataCache.js' , data, function(err) {
            if ( err ) {
                console.log(err);
            }
        });
    });
    client.on('nodeGraphMap' , function(data) {
        // Save data
        fs.appendFile('graphMap.js' , data, function(err) {
            if ( err ) {
                console.log(err);
            }
        });
    });
});