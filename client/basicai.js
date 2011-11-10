var client = require('./client.js');
var theCards = require('./../server/cards.js');
var rl = require('readline');
var event = require('events');

exports.BasicClientHandler = new Class({
	Extends: client.ClientHandler,
	
	namecount: 0,
	
	getName: function(cb, invalid) {
		if(invalid) {
			this.myname = this.ai.name + this.namecount++;
		}
		else {
			this.myname = this.ai.name;
		}
		cb(this.myname);
	},
	
	welcome: function() {
		if(this.ai.autostart) {
			this.startGameTimeout = this.client.start.delay(3000, this.client);
		}
		this.ai.welcome = true;
		this.ai.emit('welcome');
	},
	
	startGame: function() {
		clearTimeout(this.startGameTimeout);
		this.ai.status.gameStarted = true;
		this.ai.status.hand = [];
	},
	
	startTurn: function() {
		
	},
	
	bank: function(cards) {
		this.ai.status.bank = cards;
	},
	
	drew: function(card) {
		this.ai.status.hand.push(card);
	},
	
	hand: function(cards) {
		this.ai.status.hand = cards;
	},
	
	actions: function(actions) {
		this.ai.status.actions = actions;
	},
	
	moreactions: function(actions) {
		this.ai.status.actions += actions;
	},
	
	buys: function(buys) {
		this.ai.status.buys = buys;
	},
	
	morebuys: function(buys) {
		this.ai.status.buys += buys;
	},
	
	cash: function(cash) {
		this.ai.status.cash = cash;
	},
	
	morecash: function(cash) {
		this.ai.status.cash += cash;
	},
	
	finishTurn: function() {
		this.ai.status.hand = [];
	},
	
	winner: function(name) {
		if(name == this.myname) {
			this.won = true;
		}
		else {
			this.won = false;
		}
		this.ai.emit('won', this.won);
	},
	
	finish: function(e) {
		if(e) {
			console.log(e);
		}
		if(this.rl) {
			this.rl.close();
			process.stdin.destroy();
		}
	},
	
	handled: function(l) {
		if(this.ai.printHandled) {
			console.log('!' + l.replace(/\n/g, '\\n'));
		}
	},
		
	unhandled: function(l) {
		if(this.ai.printUnhandled) {
			console.log('>' + l.replace(/\n/g, '\\n'));
		}
	}
});

var name = 'basicai';

exports.BasicAI = new Class({
	Extends: event.EventEmitter,
	
	status: {},
	name: name,
	supportedAction: [],
	handler: exports.BasicClientHandler,
	
	initialize: function(host, autostart, handled, unhandled) {
		this.host = host;
		this.autostart = autostart;
		this.printHandled = handled;
		this.printUnhandled = unhandled;
		this.handler = new this.handler();
		this.handler.ai = this;
		this.client = new client.Client(this.handler);
		this.handler.client = this.client;
		if(this.host) {
			this.client.connect(this.host);
		}
		else {
			this.rl = rl.createInterface(process.stdin, process.stdout, null);
			this.rl.question("What is the host address?\n", function(host) {
				this.client.connect(host);
			}.bind(this));
		}
	}
});

exports.BasicAI.aiName = name;