//logging
//var fs = require('fs');
//var logstr = fs.createWriteStream('log', {flags: 'a'});
var logbuff = [];
var log = function(m) {
	//logstr.write(m + '\n');
	//console.log(m);
	logbuff.push(m);
	if(logbuff.length > 500) {
		logbuff.shift();
	}
};

//game server
var player = require('./playerhandler.js');
var server = require('net').createServer(function(socket) {
	new player.PlayerHandler(socket, log);
}).listen(5678);
console.log('Server started on 127.0.0.1:5678');

//debug server
require('http').createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain'});
	logbuff.each(function(l) {
		response.write(l + '\n');
	});
	response.end();
}).listen(5679);
console.log('Log server started on http://127.0.0.1:5679/');
