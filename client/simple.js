var client = require('./client.js');
var theCards = require('./../server/cards.js');
var rl = require('readline');

var SimpleClient = new Class({
	Extends: client.ClientHandler,
	
	status: {},
	
	initialize: function() {
		//this.rl = rl.createInterface(process.stdin, process.stdout, null);
		//this.rl.question("What is the host address?\n", function(host) {
		//	this.client.connect(host);
		//}.bind(this));
	},
	
	init: function() {
		this.client.connect('localhost');
	},
	
	namecount: 0,
	
	getName: function(cb, invalid) {
		if(invalid) {
			cb('simple' + this.namecount++);
		}
		else {
			cb('simple');
		}
	},
	
	welcome: function() {
		this.startGameTimeout = this.client.start.delay(3000, this.client);
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
		var highest, highestCost = -1;
		cards.each(function(card) {
			var c = theCards.getCard(card);
			if(c.cost > highestCost && (c.treasure > 0 || c.points > 0 || c.getPoints)) {
				highest = card;
				highestCost = c.cost;
			}
		});
		this.client.buy(highest);
	},
	
	finishTurn: function() {
		this.status.hand = [];
	},
	
	finish: function(e) {
		if(e) {
			console.log(e);
		}
		console.log('Bye');
		//this.rl.close();
		process.stdin.destroy();
	},
	
	handled: function(l) {
		//console.log('!' + l.replace(/\n/g, '\\n'));
	},
		
	unhandled: function(l) {
		console.log('>' + l.replace(/\n/g, '\\n'));
	}
});

new client.Client(new SimpleClient());