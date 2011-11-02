require('mootools');

var Card = new Class({
	name: 'blank',
	cost: 0,
	treasure: 0,
	getPoints: function(player) {
		return 0;
	}
});

exports.Deck = new Class({
	cards: {},
	trashed: [],
	
	initialize: function(players) {
		for(var i = 0;i < 50;i++) {
			this.add(new exports.Copper());
		}
		for(i = 0;i < 40;i++) {
			this.add(new exports.Silver());
		}
		for(i = 0;i < 30;i++) {
			this.add(new exports.Gold());
		}
	
		var curses = 30
			victories = 12;
		if(players <= 2) {
			curses = 10;
			victories = 12;
		}
		else if(players = 3) {
			curses = 20;
		}
	
		for(i = 0;i < curses;i++) {
			this.add(new exports.Curse());
		}
		
		for(i = 0;i < victories;i++) {
			this.add(new exports.Estate());
			this.add(new exports.Duchy());
			this.add(new exports.Province());
		}
		
		//plus 3 for each player
		for(i = 0;i < players * 3;i++) {
			this.add(new exports.Estate());
		}
		
		//10 random actions
		var actions = actionCards.slice();
		var c, chosen = 0;
		do {
			chosen++;
			i = Math.floor(Math.random() * actions.length);
			c = actions.splice(i, 1)[0];
			for(i = 0;i < 10;i++) {
				this.add(new c());
			}
		}
		while(actions.length > 0 && chosen < 10);
	},
	
	add: function(card) {
		this.cards[card.name] = this.cards[card.name] || [];
		this.cards[card.name].push(card);
	},
	
	take: function(name) {
		if(this.has(name)) {
			return this.cards[name].pop();
		}
		return false;
	},
	
	has: function(name) {
		return !!this.cards[name] && this.cards[name].length > 0;
	},
	
	cost: function(name) {
		if(this.has(name)) {
			return this.cards[name][0].cost;
		}
	},
	
	trash: function(card) {
		this.trashed.push(card);
	},
	
	shouldEnd: function() {
		var empties = 0;
		var some = Object.some(this.cards, function(cards, name) {
			if(cards.length == 0) {
				if(name == 'province') {
					return true;
				}
				empties++;
			}
			return false;
		});
		return some || empties >= 3;
	},
	
	describe: function() {
		var d = '';
		Object.each(this.cards, function(cards, name) {
			d += name + ': ' + cards.length + '\n';
		});
		return d;
	},
	
	describeTrash: function() {
		var d = '';
		this.trashed.each(function(card) {
			d += card.name + '\n';
		});
		if(d == '') {
			d = 'the trash is empty\n';
		}
		return d;
	}
});

var actionCards = [];

exports.Copper = new Class({
	Extends: Card,
	name: 'copper',
	treasure: 1
});

exports.Silver = new Class({
	Extends: Card,
	name: 'silver',
	cost: 3,
	treasure: 2
});

exports.Gold = new Class({
	Extends: Card,
	name: 'gold',
	cost: 6,
	treasure: 3
});

exports.Estate = new Class({
	Extends: Card,
	name: 'estate',
	cost: 2,
	getPoints: function() {
		return 1;
	}
});

exports.Duchy = new Class({
	Extends: Card,
	name: 'duchy',
	cost: 5,
	getPoints: function() {
		return 3;
	}
});

exports.Province = new Class({
	Extends: Card,
	name: 'province',
	cost: 8,
	getPoints: function() {
		return 6;
	}
});

exports.Gardens = new Class({
	Extends: Card,
	name: 'gardens',
	cost: 4,
	getPoints: function(player) {
		return Math.floor(player.cards.length / 10);
	}
});

exports.Curse = new Class({
	Extends: Card,
	name: 'curse',
	cost: 0,
	getPoints: function() {
		return -1;
	}
});

exports.Smithy = new Class({
	Extends: Card,
	name: 'smithy',
	cost: 4,
	doAction: function(turn) {
		turn.player.draw(3);
		return true;
	}
});

actionCards.push(exports.Smithy);

exports.Market = new Class({
	Extends: Card,
	name: 'market',
	cost: 5,
	doAction: function(turn) {
		turn.player.draw(1);
		turn.actions += 1;
		turn.buys += 1;
		turn.treasure += 2;
		return true;
	}
});

actionCards.push(exports.Market);