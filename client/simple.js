var client = require('./client.js');
var cards = require('./../server/cards.js');

var SimpleClient = new Class({
	Extends: client.ClientHandler,
	
	initialize: function() {
		this.rli = rl.createInterface(process.stdin, process.stdout, null);
		this.rli.question("What is the host address?\n", function(host) {
			this.client.connect(host);
		}.bind(this));
	},
	
	getName: function(cb) {
		cb('simple');
	},
	
	startGame: function() {
		this.gameStarted = true;
		this.hand = [];
	},
	
	startTurn: function() {
		this.startTurnWaiting = true;
	},
	
	emptyLine: function() {
		if(this.startTurnWaiting) {
			this.startTurnWaiting = false;
			this.client.canbuy();
		}
	},
	
	bank: function(cards) {
		this.bank = cards;
	},
	
	drew: function(card) {
		this.hand.push(card);
	},
	
	hand: function(cards) {
		this.hand = cards;
	},
	
	actions: function(actions) {
		this.actions = actions;
	},
	
	buys: function(buys) {
		this.buys = buys;
	},
	
	cash: function(cash) {
		this.cash = cash;
	},
	
	canbuy: function(cards) {
		
	},
	
	finishTurn: function() {
		this.hand = [];
	},
	
	finish: function(e) {
		if(e) {
			console.log(e);
		}
		console.log('Bye');
		this.rli.close();
		process.stdin.destroy();
	},
		
	unhandled: function(l) {
		console.log('>' + l.replace(/\n/g, '\\n'));
	}
});

new client.Client(new SimpleClient());