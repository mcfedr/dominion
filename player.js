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
	},
	
	reveal: function() {
		if(this.deck.length == 0) {
			this.shuffle();
		}
		return this.deck.pop()
	},
	
	draw: function(count) {
		count = count || 5;
		var c, i;
		for(i = 0;i < count;i++) {
			this.hand.push(this.reveal());
		}
	},
	
	play: function(card) {
		this.hand.erase(card);
		this.table.push(card);
	},
	
	trash: function(card) {
		this.hand.erase(card);
		this.table.erase(card);
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
		this.deck.each(function(c) {
			s += (c.getPoints ? c.getPoints(this) : c.points);
		}, this);
		this.discard.each(function(c) {
			s += (c.getPoints ? c.getPoints(this) : c.points);
		}, this);
		this.hand.each(function(c) {
			s += (c.getPoints ? c.getPoints(this) : c.points);
		}, this);
		this.table.each(function(c) {
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