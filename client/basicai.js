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

var client = require('./client.js');
var theCards = require('./../server/cards.js');
var rl = require('readline');
var event = require('events');
require('./../server/functions.js');

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
	
	welcome: function(game) {
		if(this.ai.autostart) {
			this.startGameTimeout = this.client.start.delay(3000, this.client);
		}
		this.ai.status.gameName = game;
		this.ai.emit('welcome');
	},
	
	startGame: function() {
		clearTimeout(this.startGameTimeout);
		this.ai.status.game = true;
		this.ai.status.hand = [];
		this.ai.status.deck = [];
		this.ai.status.table = [];
		this.ai.status.discard = [];
		this.ai.status.turns = 0;
		this.ai.status.numCards = 10;
	},
	
	startTurn: function() {
		this.ai.status.turn = true;
		this.ai.status.turns++;
		this.ai.status.buyPhase = false;
	},
	
	finishTurn: function() {
		this.ai.status.turn = false;
	},
	
	bank: function(cards) {
		this.ai.status.bank = cards;
	},
	
	drew: function(card) {
		this.ai.status.deck.removeOne(card);
		this.ai.status.hand.push(card);
	},
	
	gain: function(card) {
		this.ai.status.discard.push(card);
		this.ai.status.numCards++;
	},
	
	addtodeck: function(card) {
		this.ai.status.deck.push(card);
		this.ai.status.numCards++;
	},
	
	returntodeck: function(card) {
		this.ai.status.hand.removeOne(card);
		this.ai.status.deck.push(card);
	},
	
	reveal: function(card) {
		this.ai.status.deck.removeOne(card);
		this.ai.status.numCards--;
	},
	
	addtohand: function(card) {
		this.ai.status.hand.push(card);
		this.ai.status.numCards++;
	},
	
	trash: function(card, table) {
		if(table) {
			this.ai.status.table.removeOne(card);
		}
		else {
			this.ai.status.hand.removeOne(card);
		}
		this.ai.status.numCards--;
	},
	
	discardCard: function(card) {
		this.ai.status.hand.removeOne(card);
		this.ai.status.discard.push(card);
	},
	
	shuffled: function() {
		this.ai.status.deck.append(this.ai.status.discard);
		this.ai.status.discard = [];
	},
	
	hand: function(cards) {
		//this.ai.status.hand = cards;
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
		this.ai.status.discard.append(this.ai.status.hand);
		this.ai.status.discard.append(this.ai.status.table);
		this.ai.status.hand = [];
		this.ai.status.table = [];
	},
	
	invalidCommand: function(commands) {
		console.log('invalid: (' + this.ai.name + ')');
		console.log(commands);
		console.log(this.ai.status);
		process.exit(1);
	},
	
	toolong: function(commands) {
		console.log('toolong: (' + this.ai.name + ')');
		console.log(commands);
		console.log(this.ai.status);
		process.exit(1);
	},
	
	winner: function(name) {
		if(name == this.myname) {
			this.won = true;
		}
		else {
			this.won = false;
		}
		this.ai.emit('won', this.won, this.ai.status);
	},
	
	finish: function(e) {
		this.ai.status.game = false;
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