var client = require('./client.js');
var rl = require('readline');

var CLClient = new Class({
	Extends: client.Client,
	
	initialize: function() {
		this.rli = rl.createInterface(process.stdin, process.stdout, null);
		this.rli.question("What is the host address?\n", function(host) {
			this.connect(host);
		}.bind(this));
	},
	
	getName: function(cb) {
		this.rli.question("What is your name?\n", cb);
	},
	
	finish: function() {
		console.log('Bye');
		this.rli.close();
		process.stdin.destroy();
	},
	
	handled: function(l) {
		//console.log(l);
	},
	
	unhandled: function(l) {
		console.log(l);
	}
});

new CLClient();