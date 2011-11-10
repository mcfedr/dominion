var client = require('./../client.js');
var theCards = require('./../../server/cards.js');
var rl = require('readline');

exports.name = 'simplenocoppernoestate'
exports.Client = new Class({
	Extends: client.ClientHandler,
	
	status: {},
	
	initialize: function(host, autostart, handled, unhandled) {
		this.host = host;
		this.autostart = autostart;
		this.printHandled = handled;
		this.printUnhandled = unhandled;
	},
	
	init: function() {
		if(this.host) {
			this.client.connect(this.host);
		}
		else {
			this.rl = rl.createInterface(process.stdin, process.stdout, null);
			this.rl.question("What is the host address?\n", function(host) {
				this.client.connect(host);
			}.bind(this));
		}
	},
	
	namecount: 0,
	
	getName: function(cb, invalid) {
		if(invalid) {
			this.myname = exports.name + this.namecount++;
		}
		else {
			this.myname = exports.name;
		}
		cb(this.myname);
	},
	
	welcome: function() {
		if(this.autostart) {
			this.startGameTimeout = this.client.start.delay(3000, this.client);
		}
		this.emit('welcome');
	},
	
	startGame: function() {
		clearTimeout(this.startGameTimeout);
		this.gameStarted = true;
		this.status.hand = [];
	},
	
	startTurn: function() {
		this.client.canbuy();
	},
	
	bank: function(cards) {
		this.status.bank = cards;
	},
	
	drew: function(card) {
		this.status.hand.push(card);
	},
	
	hand: function(cards) {
		this.status.hand = cards;
	},
	
	actions: function(actions) {
		this.status.actions = actions;
	},
	
	buys: function(buys) {
		this.status.buys = buys;
	},
	
	cash: function(cash) {
		this.status.cash = cash;
	},
	
	canbuy: function(cards) {
		var highest, highestCost = 0;
		cards.each(function(card) {
			var c = theCards.getCard(card);
			if(c.cost > highestCost && (c.treasure > 0 || c.points > 1 || c.getPoints)) {
				highest = card;
				highestCost = c.cost;
			}
		});
		if(highest) {
			this.client.buy(highest);
		}
		else {
			this.client.done();
		}
	},
	
	finishTurn: function() {
		this.status.hand = [];
	},
	
	finish: function(e) {
		if(e) {
			console.log(e);
		}
		//console.log('Bye');
		if(this.rl) {
			this.rl.close();
			process.stdin.destroy();
		}
	},
	
	winner: function(name) {
		if(name == this.myname) {
			this.won = true;
		}
		else {
			this.won = false;
		}
		this.emit('won', this.won);
	},
	
	handled: function(l) {
		if(this.printHandled) {
			console.log('!' + l.replace(/\n/g, '\\n'));
		}
	},
		
	unhandled: function(l) {
		if(this.printUnhandled) {
			console.log('>' + l.replace(/\n/g, '\\n'));
		}
	}
});