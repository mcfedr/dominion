require('mootools');

var Card = new Class({
	name: 'blank',
	description: 'blank',
	cost: 0,
	treasure: 0,
	points: 0
});

exports.Deck = new Class({
	cards: {},
	trashed: [],
	
	initialize: function(players) {
		for(var i = 0;i < 50;i++) {
			this.add(new exports.copper());
		}
		for(i = 0;i < 40;i++) {
			this.add(new exports.silver());
		}
		for(i = 0;i < 30;i++) {
			this.add(new exports.gold());
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
			this.add(new exports.curse());
		}
		
		for(i = 0;i < victories;i++) {
			this.add(new exports.estate());
			this.add(new exports.duchy());
			this.add(new exports.province());
		}
		
		//plus 3 for each player
		for(i = 0;i < players * 3;i++) {
			this.add(new exports.estate());
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

exports.copper = new Class({
	Extends: Card,
	name: 'copper',
	description: '1 Treasure',
	treasure: 1
});

exports.silver = new Class({
	Extends: Card,
	name: 'silver',
	description: '2 Treasure',
	cost: 3,
	treasure: 2
});

exports.gold = new Class({
	Extends: Card,
	name: 'gold',
	description: '3 Treasure',
	cost: 6,
	treasure: 3
});

exports.estate = new Class({
	Extends: Card,
	name: 'estate',
	description: '1 Victory Point',
	cost: 2,
	points: 1
});

exports.duchy = new Class({
	Extends: Card,
	name: 'duchy',
	description: '3 Victory Points',
	cost: 5,
	points: 3
});

exports.province = new Class({
	Extends: Card,
	name: 'province',
	description: '6 Victory Points',
	cost: 8,
	points: 6
});

exports.gardens = new Class({
	Extends: Card,
	name: 'gardens',
	description: '1 Victory point for every 10 cards in your deck (rounded down)',
	cost: 4,
	getPoints: function(player) {
		return Math.floor(player.cards.length / 10);
	}
});

exports.curse = new Class({
	Extends: Card,
	name: 'curse',
	description: '-1 Victory Point',
	cost: 0,
	points: -1
});

exports.chapel = new Class({
	Extends: Card,
	name: 'chapel',
	description: 'Trash up to 4 cards from your hand',
	cost: 2,
	doAction: function(turn, done) {
		var count = 0;
		
		var selectcard = function(card) {
			if(card != 'done') {
				if(turn.player.hand.some(function(hcard) {
					if(!hcard.played && hcard.card.name == card) {
						turn.player.trash(hcard.card);
						turn.game.deck.trash(hcard.card);
						return true;
					}
				})) {
					count++;
				}
				else {
					turn.handler.message('You don\'t have this card\n');
				}
				if(count < 4) {
					return true;
				}
				else {
					done(true);
					return false;
				}
			}
			else {
				done(true);
			}
		};
		turn.handler.nextData = selectcard;
		turn.handler.message('Choose up to 4 cards to trash\nType done when you are finished choosing');
	}
});

actionCards.push(exports.chapel);

exports.thief = new Class({
	Extends: Card,
	name: 'thief',
	description: 'Each other player revels the top 2 cards of his deck\n'
		+ 'If they revealed any Treasure cards, they one of them that you choose\n'
		+ 'You may gain any or all of these trashed cards. '
		+ 'They discard any other revealed cards.',
	cost: 4
});

exports.moneylender = new Class({
	Extends: Card,
	name: 'moneylender',
	description: 'Trash a copper from your hand\nIf you do, + 3 Treasure',
	cost: 4,
	doAction: function(turn, done) {
		if(turn.player.hand.some(function(hcard) {
			if(!hcard.played && hcard.card.name == 'copper') {
				turn.player.trash(hcard.card);
				turn.game.deck.trash(hcard.card);
				return true;
			}
		})) {
			turn.treasure += 3;
			done();
		}
		else {
			turn.handler.message('You don\'t have a copper\n');
		}
	}
});

actionCards.push(exports.moneylender);

exports.feast = new Class({
	Extends: Card,
	name: 'feast',
	description: 'Trash this card.\n Gain a card costing up to 5 Treasure',
	cost: 4
});

exports.festival = new Class({
	Extends: Card,
	name: 'festival',
	description: '+2 Actions\n+1 Buy\n+2 Treasure',
	cost: 5,
	doAction: function(turn, done) {
		turn.actions += 2;
		turn.buys += 1;
		turn.treasure += 2;
		done();
	}
});

actionCards.push(exports.festival);

exports.laboratory = new Class({
	Extends: Card,
	name: 'laboratory',
	description: '+2 Cards\n+1 Action',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(2);
		turn.actions += 1;
		done();
	}
});

actionCards.push(exports.laboratory);

exports.witch = new Class({
	Extends: Card,
	name: 'witch',
	description: '+2 Cards\nEach other player gains a Curse card',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(2);
		turn.game.handlers.every(function(h) {
			if(h == turn.handler) {
				return true;
			}
			if(turn.game.deck.has('curse')) {
				h.player.gain(this.game.deck.take('curse'));
				return true;
			}
			return false;
		});
		done();
	}
});

actionCards.push(exports.witch);

exports.spy = new Class({
	Extends: Card,
	name: 'spy',
	description: '+1 Card\n+1 Action\nEach player including you reveals the top '
		+ 'card of his deck and either discards or puts it back, your choice',
	cost: 4
});

exports.chanceller = new Class({
	Extends: Card,
	name: 'chanceller',
	description: '+2 Treasure\hYou may immedietly put your deck into your discard pile.',
	cost: 3
});

exports.workshop = new Class({
	Extends: Card,
	name: 'workshop',
	description: 'Gain a card costing up to 4 Treasure',
	cost: 3
});

exports.adventurer = new Class({
	Extends: Card,
	name: 'adventurer',
	description: 'Reveal cards from your deck until you reveal 2 Treasure cards.\n'
		+ 'Put these treasure cards into your hand and discard the other revealed cards.',
	cost: 6
});

exports.remodel = new Class({
	Extends: Card,
	name: 'remodel',
	description: 'Trash a card from your hand.\nGain a card costing up to 2 Treasure more '
		+ 'than the trashed card.',
	cost: 4
});

exports.councilroom = new Class({
	Extends: Card,
	name: 'councilroom',
	description: '+4 Cards\n+1 Buy\nEach other player draws a card',
	cost: 5
});

exports.cellar = new Class({
	Extends: Card,
	name: 'cellar',
	description: '+1 Action\n Discard any number of cards.\n'
		+ '+1 Card per card discarded.',
	cost: 2
});

exports.moat = new Class({
	Extends: Card,
	name: 'moat',
	description: '+2 Cards\nWhen another player plays an Attack card, you may\n'
		+ 'reveal this from your hand. If you do, you are unaffected by that Attack.',
	cost: 2
});

exports.village = new Class({
	Extends: Card,
	name: 'village',
	description: '+1 Card\n+2 Actions',
	cost: 3,
	doAction: function(turn, done) {
		turn.player.draw(1);
		turn.actions += 2;
		done();
	}
});

actionCards.push(exports.village);

exports.woodcutter = new Class({
	Extends: Card,
	name: 'woodcutter',
	description: '+1 Buy\n+2 Treaure',
	cost: 3,
	doAction: function(turn, done) {
		turn.buys += 1;
		turn.treasure += 2;
		done();
	}
});

actionCards.push(exports.woodcutter);

exports.militia = new Class({
	Extends: Card,
	name: 'militia',
	description: '+2 Treasure\nEach other player discards down to 3 cards in his hand.',
	cost: 4
});

exports.bureaucrat = new Class({
	Extends: Card,
	name: 'bureaucrat',
	description: 'Gain a Silver card; put it on top of your deck.\n'
		+ 'Each other player reveals a Victory card from his hand and puts it on his deck '
		+ '(or reveals a hand with no Victory cards)',
	cost: 4
});

exports.throneroom = new Class({
	Extends: Card,
	name: 'throneroom',
	description: 'Choose an Action card in your hand.\nPlay it twice.',
	cost: 4
});

exports.library = new Class({
	Extends: Card,
	name: 'library',
	description: 'Draw until you have 7 cards in hand.\nYou may set aside any Action cards '
		+ 'drawn this way, as you draw them; discard the set aside cards after you finish drawing.',
	cost: 4
});

exports.mine = new Class({
	Extends: Card,
	name: 'mine',
	description: 'Trash a Treasure card from your hand. Gain a treasure card costing up to 3 Treasure more; '
		+ 'put it into your hand',
	cost: 4
});

exports.smithy = new Class({
	Extends: Card,
	name: 'smithy',
	description: '+3 Cards',
	cost: 4,
	doAction: function(turn, done) {
		turn.player.draw(3);
		done();
	}
});

actionCards.push(exports.smithy);

exports.market = new Class({
	Extends: Card,
	name: 'market',
	description: '+1 Card\n+1 Action\n+1 Buy\n+1 Treasure',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(1);
		turn.actions += 1;
		turn.buys += 1;
		turn.treasure += 2;
		done();
	}
});

actionCards.push(exports.market);