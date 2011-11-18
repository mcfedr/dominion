/**
*   This file is part of dominion-client.
*   Copyright Fred Cox 2011
*
*   dominion-client is free software: you can redistribute it and/or modify
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
*    along with dominion-client.  If not, see <http://www.gnu.org/licenses/>.
*/

require('./mootools.js');
var net = require('net');
var event = require('events');

exports.Connection = new Class({
	Extends: event.EventEmitter,
	
	initialize: function(host) {
		this.socket = net.createConnection(5678, host);
		this.socket.setEncoding('utf8');
		this.socket.on('connect', function(d) {
			this.emit('connect', d);
		}.bind(this));
		this.socket.on('data', function(d) {
			this.emit('data', d);
		}.bind(this));
		this.socket.on('end', function(d) {
			this.emit('end', d);
		}.bind(this));
		this.socket.on('error', function(d) {
			this.emit('error', d);
		}.bind(this));
		this.on('data', this.data.bind(this));
	},
	
	buffer: '',
	
	data: function(data) {
		data = this.buffer + data;
		if(data.length == 0 || data.charAt(data.length - 1) != '\n') {
			this.buffer = data;
			return;
		}
		this.buffer = '';
		data = data.trim();
		if(data == '') {
			return;
		}
		var lines = data.split('\n');
		if(lines.length) {
			lines.each(function(l) {
				this.emit('line', l);
			}, this);
		}
	},
	
	message: function(message) {
		this.socket.write(message);
	}
});