require('mootools');
var cards = require('./cards.js');

var Player = exports.Player = new Class({
	cards: [],
	deck: [],
	discard: [],
	hand: [],
	initialize: function(name) {
		this.name = name;
	},
	
	shuffle: function() {
		var i;
		do {
			i = Math.floor(Math.random() * this.discard.length);
			this.deck.push(this.discard.splice(i, 1)[0]);
		}
		while(this.discard.length > 0);
	},
	
	gain: function(card) {
		this.discard.push(card);
		this.cards.push(card);
	},
	
	draw: function(count) {
		count = count || 5;
		var c, i;
		for(i = 0;i < count;i++) {
			if(this.deck.length == 0) {
				this.shuffle();
			}
			this.hand.push({card: this.deck.pop(), played: false});
		}
	},
	
	trash: function(card) {
		this.cards.erase(card);
		this.deck.erase(card);
		this.discard.erase(card);
		this.hand.each(function(hcard) {
			if(hcard.card == card) {
				this.hand.erase(hcard);
			}
		}, this);
		this.handler.message('you trashed a ' + card.name + '\n');
		this.handler.game.message(this.name + ' trashed a ' + card.name + '\n', this.handler);
	},
	
	discardHand: function() {
		this.hand.each(function(h) {
			this.discard.push(h.card);
		}, this);
		this.hand = [];
	},
	
	score: function() {
		var s = 0;
		this.cards.each(function(c) {
			s += (c.getPoints ? c.getPoints(this) : c.points);
		}, this);
		return s;
	}
});