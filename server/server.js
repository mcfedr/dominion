/**
*   This file is part of dominion-server.
*   Copyright Fred Cox 2011
*
*   dominion-server is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    dominion-server is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with dominion-server.  If not, see <http://www.gnu.org/licenses/>.
*/

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
