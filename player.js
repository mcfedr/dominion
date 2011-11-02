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
	
	discardHand: function() {
		this.hand.each(function(h) {
			this.discard.push(h.card);
		}, this);
		this.hand = [];
	},
	
	score: function() {
		var s = 0;
		this.cards.each(function(c) {
			s += c.getPoints(this);
		}, this);
		return s;
	}
});