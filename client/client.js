require('./mootools.js');
var cn = require('./connection.js');

exports.Client = new Class({
	initialize: function() {
		
	},
	
	finish: function(e) {
		
	},
	
	connect: function(host) {
		this.host = host;
		this.connection = new cn.Connection(host);
		this.connection.on('connect', this.connected.bind(this));
		this.connection.on('line', this.line.bind(this));
		this.connection.on('error', this.error.bind(this));
		this.connection.on('end', this.end.bind(this));
	},
	
	start: function(cb) {
		this.message('start');
		
	},
	
	message: function(message) {
		if(this.connected) {
			this.connection.message(message + '\n');
		}
	},
	
	connected: function() {
		this.connected = true;
	},
	
	handlers: {
		'what is your name?': function() {
			this.getName(this.message.bind(this));
			return true;
		},
		'Bye': function() {
			//this.end();
			return true;
		}
		
	},
	
	line: function(line) {
		var handled = false;
		if(this.handlers[line]) {
			handled = this.handlers[line].apply(this);
		}
		if(handled) {
			this.handled(line);
		}
		else {
			this.unhandled(line);
		}
	},
	
	error: function(e) {
		this.connected = false;
		this.finish(e);
	},
	
	end: function() {
		this.connected = false;
		this.finish();
	}
});