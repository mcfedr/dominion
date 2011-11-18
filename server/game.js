/**
*   This file is part of dominion-server.
*   Copyright Fred Cox 2011
*
*   dominion-server is free software: you can redistribute it and/or modify
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
*    along with dominion-server.  If not, see <http://www.gnu.org/licenses/>.
*/

require('./mootools.js');
require('./functions.js');
var turn = require('./turn.js');
var cards = require('./cards.js');

var gamenum = 0;

exports.Game = new Class({
	handlers: [],
	started: false,
	ended: false,
	currentPlayer: -1,
	
	initialize: function(log) {
		this.gamenum = gamenum++;
		this.log = log;
	},
	
	start: function() {
		this.log(':' + this.gamenum + ':starting game');
		this.started = new Date();
		this.message('the game has started\n');
		
		//shuffle the players
		var tmp = this.handlers;
		this.handlers = [];
		var i;
		do {
			i = Math.floor(Math.random() * tmp.length);
			this.handlers.push(tmp.splice(i, 1)[0]);
		}
		while(tmp.length > 0);
		
		this.deck = new cards.Deck(this.handlers.length);
		this.message(this.deck.describe());
		
		//deal
		this.handlers.each(function(h) {
			for(var i = 0;i < 3;i++) {
				h.player.gain(this.deck.take('estate'), true);
			}
			for(i = 0;i< 7;i++) {
				h.player.gain(this.deck.take('copper'), true);
			}
			h.player.draw();
		}, this);
		
		//start the first turn
		this.turn.delay(0, this);
	},
	
	turn: function() {
		if(!this.ended) {
			if(this.handlers.length > 0) {
				this.currentPlayer = (this.currentPlayer + 1) % this.handlers.length;
				new turn.Turn(this, this.handlers[this.currentPlayer], this.turn.bind(this));
			}
			else {
				this.end();
			}
		}
	},
	
	message: function(message, noth) {
		this.handlers.each(function(h) {
			if(h != noth && h.player) {
				h.message(message);
			}
		});
	},
	
	command: function(commands, handler) {
		if(commands[0] == 'start') {
			if(!this.started) {
				this.start();
			}
			else {
				handler.message('the game has already started\n');
			}
			return true;
		}
		else if(commands[0] == 'show') {
			if(commands[1] == 'bank' && this.deck) {
				handler.message(this.deck.describe());
				return true;
			}
			else if(commands[1] == 'trash' && this.deck) {
				handler.message(this.deck.describeTrash());
				return true;
			}
			else if(commands[1] == 'game') {
				if(!this.started) {
					this.message('game hasn\'t been started yet\n');
				}
				else {
					this.message('game started at ' + this.started + '\n'
						+ 'it\'s currently ' + this.handlers[this.currentPlayer].player.name.possessive() + ' turn');
				}
				return true;
			}
			else if(commands[1] == 'players') {
				this.handlers.each(function(h, index) {
					if(h.player) {
						handler.message(h.player.name + (this.currentPlayer == index ? '*' : '') + '\n');
					}
				}, this);
				return true;
			}
			else if(commands[1] == 'player') {
				return this.handlers.some(function(h) {
					if(h.player.name == commands[2]) {
						this.message(h.player.describe());
						return true;
					}
				}, this);
			}
		}
		return false;
	},
	
	checkStart: function() {
		if(this.handlers.length == 4) {
			this.start.delay(0, this);
		}
	},
	
	checkEnd: function() {
		var should = this.deck.shouldEnd();
		if(should) {
			this.message('the game finished because ' + should + '\n');
			var winner = 'nobody', winningScore = 0;
			this.handlers.each(function(h) {
				var s = h.player.score();
				if(s > winningScore) {
					winner = h.player.name;
					winningScore = s;
				}
				this.message(h.player.name + ': ' + s + ' (turns: ' + h.player.turns + ')\n');
			}, this);
			this.message('the winner is ' + winner + '\n');
			this.end();
			return true;
		}
		return false;
	},
	
	end: function() {
		this.log(':' + this.gamenum + ':finished game');
		this.ended = true;
		this.message('the game has finished\n');
		this.handlers.each(function(h) {
			h.end.delay(0, h);
		});
	}
});