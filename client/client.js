require('./mootools.js');
var cn = require('./connection.js');

exports.Client = new Class({
	initialize: function() {
		
	},
	
	finish: function() {
		
	},
	
	connect: function(host) {
		this.host = host;
		this.connection = new cn.Connection(host);
		this.connection.on('connect', this.connected.bind(this));
		this.connection.on('line', this.line.bind(this));
		this.connection.on('error', this.error.bind(this));
		this.connection.on('end', this.end.bind(this));
	},
	
	message: function(message) {
		if(this.connected) {
			this.connection.message(message + '\n');
		}
	},
	
	connected: function() {
		this.connected = true;
	},
	
	line: function(line) {
		var handled = false;
		if(line == 'what is your name?') {
			handled = true;
			this.getName(this.message.bind(this));
		}
		if(handled) {
			this.handled(line);
		}
		else {
			this.unhandled(line);
		}
	},
	
	error: function(e) {
		console.log(e);
		this.connected = false;
		this.finish();
	},
	
	end: function() {
		this.connected = false;
		this.finish();
	}
});