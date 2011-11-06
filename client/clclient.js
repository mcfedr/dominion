var client = require('./client.js');
var rl = require('readline');

var CLClient = new Class({
	Extends: client.Client,
	
	initialize: function() {
		this.rli = rl.createInterface(process.stdin, process.stdout, null);
		this.rli.question("What is the host address?\n", function(host) {
			this.connect(host);
		}.bind(this));
		//this.rli.on('line', this.inputLine.bind(this));
	},
	
	getName: function(cb) {
		this.rli.question("What is your name punk?\n", cb);
	},
	
	finish: function(e) {
		if(e) {
			console.log(e);
		}
		console.log('Bye');
		this.rli.close();
		process.stdin.destroy();
	},
	
	inputLine: function(line) {
		
	},
	
	handled: function(l) {
		//console.log(l);
	},
	
	unhandled: function(l) {
		console.log('>' + l.replace(/\n/g, '\\n'));
	}
});

new CLClient();