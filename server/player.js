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
var cards = require('./cards.js');

var Player = exports.Player = new Class({
	deck: [],
	discard: [],
	hand: [],
	table: [],
	turns: 0,
	
	initialize: function(name) {
		this.name = name;
	},
	
	shuffles: 0,
	
	shuffle: function() {
		this.shuffles++;
		this.deck.each(function(c) {
			this.discard.push(c);
		}, this);
		this.deck = [];
		var i;
		do {
			i = Math.floor(Math.random() * this.discard.length);
			this.deck.push(this.discard.splice(i, 1)[0]);
		}
		while(this.discard.length > 0);
		this.handler.message('you shuffled your cards\n');
	},
	
	gain: function(card, quiet) {
		this.discard.push(card);
		if(!quiet) {
			this.handler.message('you gained a ' + card.name + '\n');
			this.handler.game.message(this.name + ' gained a ' + card.name + '\n', this.handler);
		}
	},
	
	addtodeck: function(card, quiet) {
		this.deck.push(card);
		if(!quiet) {
			this.handler.message('you added a ' + card.name + ' to your deck\n');
			this.handler.game.message(this.name + ' decked a ' + card.name + '\n', this.handler);
		}
	},
	
	returntodeck: function(card, quiet) {
		this.hand.erase(card);
		this.deck.push(card);
		if(!quiet) {
			this.handler.message('you returned a ' + card.name + ' to your deck\n');
			this.handler.game.message(this.name + ' decked a ' + card.name + '\n', this.handler);
		}
	},
	
	reveal: function(quiet) {
		if(this.deck.length == 0) {
			this.shuffle();
		}
		var c = this.deck.pop();
		if(!quiet) {
			if(c) {
				this.handler.message('you revealed a ' + c.name + '\n');
				this.handler.game.message(this.name + ' revealed a ' + c.name + '\n', this.handler);
			}
			else {
				this.handler.message('you have no more cards in your deck\n');
			}
		}
		return c;
	},
	
	draw: function(count, quiet) {
		count = count || 5;
		var c, i;
		for(i = 0;i < count;i++) {
			c = this.reveal(true);
			if(c) {
				this.hand.push(c);
			}
			else {
				break;
			}
			if(!quiet) {
				if(c) {
					this.handler.message('you drew a ' + c.name + '\n');
				}
				else {
					this.handler.message('you have no more cards in your deck\n');
				}
			}
		}
	},
	
	addtohand: function(card, quiet, quietall) {
		this.hand.push(card);
		if(!quiet) {
			this.handler.message('you added a ' + card.name + ' to your hand\n');
		}
		if(!quietall) {
			this.handler.game.message(this.name + ' added a ' + card.name + ' to his hand\n', this.handler);
		}
	},
	
	play: function(card) {
		this.hand.erase(card);
		this.table.push(card);
		this.handler.message('you played a ' + card.name + '\n');
		this.handler.game.message(this.name + ' played a ' + card.name + '\n', this.handler);
	},
	
	trash: function(card, table) {
		if(table) {
			this.table.erase(card);
			this.handler.message('you trashed a ' + card.name + ' from your table\n');
			this.handler.game.message(this.name + ' trashed a ' + card.name + ' from his table\n', this.handler);
		}
		else {
			this.hand.erase(card);
			this.handler.message('you trashed a ' + card.name + ' from your hand\n');
			this.handler.game.message(this.name + ' trashed a ' + card.name + ' from his hand\n', this.handler);
		}
	},
	
	discardCard: function(card) {
		this.hand.erase(card);
		this.discard.push(card);
		this.handler.message('you discarded a ' + card.name + '\n');
		this.handler.game.message(this.name + ' discarded a ' + card.name + '\n', this.handler);
	},
	
	cards: function() {
		return this.deck.concat(this.discard).concat(this.hand).concat(this.table);
	},
	
	playsMoat: function(cb, handler) {
		if(!this.hand.some(function(card) {
			if(card.name == 'moat') {
				var timeout = cb.delay(5000, this, [false]);
				this.handler.message('moat: do you want to play your moat\n');
				this.handler.nextData = function(reply) {
					clearTimeout(timeout);
					if(reply == 'yes') {
						this.handler.game.message(this.name + ' played a moat\n', this.handler);
						cb(true);
					}
					else {
						cb(false);
					}
				}.bind(this);
				return true;
			}
			return false;
		}, this)) {
			cb(false);
		}
	},
	
	discardHand: function() {
		this.hand.each(function(card) {
			this.discard.push(card);
		}, this);
		this.table.each(function(card) {
			this.discard.push(card);
		}, this);
		this.hand = [];
		this.table = [];
	},
	
	score: function() {
		var s = 0;
		this.cards().each(function(c) {
			s += (c.getPoints ? c.getPoints(this) : c.points);
		}, this);
		return s;
	},
	
	describe: function() {
		var d = this.name + '\n';
		d += 'current score: ' + this.score() + '\n';
		d += 'total cards: ' + this.cards().length + '\n';
		d += '# shuffles: ' + this.shuffles + '\n';
		d += 'deck:\n';
		this.deck.each(function(c) {
			d += c.name + '\n';
		}, this);
		d += 'discard:\n';
		this.discard.each(function(c) {
			d += c.name + '\n';
		}, this);
		d += 'hand:\n';
		this.hand.each(function(c) {
			d += c.name + '\n';
		}, this);
		d += 'table:\n';
		this.table.each(function(c) {
			d += c.name + '\n';
		}, this);
		return d;
	}
});