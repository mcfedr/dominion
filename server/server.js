var net = require('net');
var game = require('./game.js');

var server = net.createServer(function(socket) {
	new game.PlayerHandler(socket);
});

server.listen(5678);
var address = server.address();
console.log('Server started on ' + address.address + ':' + address.port);
