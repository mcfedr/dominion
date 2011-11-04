require('./mootools.js');
var cards = require('./cards.js');

var Player = exports.Player = new Class({
	deck: [],
	discard: [],
	hand: [],
	table: [],
	
	initialize: function(name) {
		this.name = name;
	},
	
	shuffles: 0,
	
	shuffle: function() {
		this.shuffles++;
		var i;
		do {
			i = Math.floor(Math.random() * this.discard.length);
			this.deck.push(this.discard.splice(i, 1)[0]);
		}
		while(this.discard.length > 0);
	},
	
	gain: function(card) {
		this.discard.push(card);
		this.handler.message('you gained a ' + card.name);
		this.handler.game.message(this.name + ' gained a ' + card.name, this.handler);
	},
	
	reveal: function(pri) {
		if(this.deck.length == 0) {
			this.shuffle();
		}
		var c = this.deck.pop();
		if(!pri) {
			this.handler.message('you revealed a ' + card.name);
			this.handler.game.message(this.name + ' revealed a ' + card.name, this.handler);
		}
	},
	
	draw: function(count) {
		count = count || 5;
		var c, i;
		for(i = 0;i < count;i++) {
			this.hand.push(this.reveal(true));
		}
		this.handler.message('you drew a ' + card.name);
	},
	
	play: function(card) {
		this.hand.erase(card);
		this.table.push(card);
		this.handler.message('you played a ' + card.name);
		this.handler.game.message(this.name + ' played a ' + card.name, this.handler);
	},
	
	trash: function(card) {
		this.hand.erase(card);
		this.table.erase(card);
		this.handler.message('you trashed a ' + card.name);
		this.handler.game.message(this.name + ' trashed a ' + card.name, this.handler);
	},
	
	cards: function() {
		return this.deck.concat(this.discard).concat(this.hand).concat(this.table);
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