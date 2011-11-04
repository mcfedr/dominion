require('./mootools.js');

var cards = {};

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
		for(var i = 0;i < 60;i++) {
			this.add(new cards.copper());
		}
		for(i = 0;i < 40;i++) {
			this.add(new cards.silver());
		}
		for(i = 0;i < 30;i++) {
			this.add(new cards.gold());
		}
	
		var curses = 30
			victories = 12;
		if(players <= 2) {
			curses = 10;
			victories = 8;
		}
		else if(players = 3) {
			curses = 20;
		}
	
		for(i = 0;i < curses;i++) {
			this.add(new cards.curse());
		}
		
		for(i = 0;i < victories;i++) {
			this.add(new cards.estate());
			this.add(new cards.duchy());
			this.add(new cards.province());
		}
		
		//plus 3 for each player
		for(i = 0;i < players * 3;i++) {
			this.add(new cards.estate());
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
	
	isTreasure: function(name) {
		if(this.has(name)) {
			return this.cards[name][0].treasure > 0;
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
		Object.each(this.cards, function(supply, name) {
			d += name + ' (' + (new cards[name]().cost) + '): ' + supply.length + '\n';
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

exports.describe = function(card) {
	if(cards[card]) {
		var c = new cards[card]();
		return c.name + ' (' + c.cost + ')\n' + c.description;
	}
	return false;
};

var actionCards = [];

cards.copper = new Class({
	Extends: Card,
	name: 'copper',
	description: '1 Treasure',
	treasure: 1
});

cards.silver = new Class({
	Extends: Card,
	name: 'silver',
	description: '2 Treasure',
	cost: 3,
	treasure: 2
});

cards.gold = new Class({
	Extends: Card,
	name: 'gold',
	description: '3 Treasure',
	cost: 6,
	treasure: 3
});

cards.estate = new Class({
	Extends: Card,
	name: 'estate',
	description: '1 Victory Point',
	cost: 2,
	points: 1
});

cards.duchy = new Class({
	Extends: Card,
	name: 'duchy',
	description: '3 Victory Points',
	cost: 5,
	points: 3
});

cards.province = new Class({
	Extends: Card,
	name: 'province',
	description: '6 Victory Points',
	cost: 8,
	points: 6
});

cards.gardens = new Class({
	Extends: Card,
	name: 'gardens',
	description: '1 Victory point for every 10 cards in your deck (rounded down)',
	cost: 4,
	getPoints: function(player) {
		return Math.floor(player.cards().length / 10);
	}
});

actionCards.push(cards.gardens);

cards.curse = new Class({
	Extends: Card,
	name: 'curse',
	description: '-1 Victory Point',
	cost: 0,
	points: -1
});

cards.chapel = new Class({
	Extends: Card,
	name: 'chapel',
	description: 'Trash up to 4 cards from your hand',
	cost: 2,
	doAction: function(turn, done) {
		var count = 0;
		var selectcard = function(cardname) {
			if(cardname != 'skip') {
				if(turn.player.hand.some(function(card) {
					if(card.name == cardname && card != this) {
						turn.player.trash(card);
						turn.game.deck.trash(card);
						return true;
					}
				}, this)) {
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
				return false;
			}
		};
		turn.handler.nextData = selectcard;
		turn.handler.message('Choose up to 4 cards to trash\nType skip if you are finished choosing');
	}
});

actionCards.push(cards.chapel);

cards.thief = new Class({
	Extends: Card,
	name: 'thief',
	description: 'Each other player revels the top 2 cards of his deck\n'
		+ 'If they revealed any Treasure cards, they one of them that you choose\n'
		+ 'You may gain any or all of these trashed cards. '
		+ 'They discard any other revealed cards.',
	cost: 4,
	doAction: function(turn, done) {
		if(turn.game.handlers.length > 1) {
			var start = turn.game.currentPlayer;
			var i = start;
			var next = function() {
				i = (i + 1) % (turn.game.handlers.length);
				if(i == start) {
					done(true);
					return;
				}
				var h = turn.game.handlers[i];
				h.player.playsMoat(function(moat) {
					if(moat) {
						next.delay(0);
					}
					else {
						var card1 = h.player.reveal();
						if(card1.treasure == 0) {
							h.player.gain(card1, true);
							card1 = null;
						}
						var card2 = h.player.reveal();
						if(card2.treasure == 0) {
							h.player.gain(card2, true);
							card2 = null;
						}
						var read = function(card) {
							if(card == 'skip') {
								next.delay(0);
								return false;
							}
							else {
								if(card1 && card1.name == card) {
									turn.player.gain(card1);
									card1 = null;
								}
								else if(card2 && card2.name == card) {
									turn.player.gain(card2);
									card2 = null;
								}
								else {
									turn.handler.message('you can\'t gain this card\n');
									return true;
								}
								if(card1) {
									turn.game.deck.trash(card1);
								}
								if(card2) {
									turn.game.deck.trash(card2);
								}
								next.delay(0);
								return false;
							}
						};
						if(card1 && card2) {
							turn.handler.message('you can gain either ' + card1.name + ' or ' + card2.name + ' or skip\n');
						}
						else if(card1) {
							turn.handler.message('you can gain either ' + card1.name + ' or skip\n');
						}
						else if(card2) {
							turn.handler.message('you can gain either ' + card2.name + ' or skip\n');
						}
						else {
							next.delay(0);
							return;
						}
						turn.handler.nextData = read;
					}
				});
			}
			next();
		}
		else {
			done();
		}
	}
});

actionCards.push(cards.thief);

cards.moneylender = new Class({
	Extends: Card,
	name: 'moneylender',
	description: 'Trash a copper from your hand\nIf you do, + 3 Treasure',
	cost: 4,
	doAction: function(turn, done) {
		if(turn.player.hand.some(function(card) {
			if(card.name == 'copper') {
				turn.player.trash(card);
				turn.game.deck.trash(card);
				return true;
			}
		})) {
			turn.addTreasure(3);
			done();
		}
		else {
			turn.handler.message('you don\'t have a copper\n');
		}
	}
});

actionCards.push(cards.moneylender);

cards.feast = new Class({
	Extends: Card,
	name: 'feast',
	description: 'Trash this card.\n Gain a card costing up to 5 Treasure',
	cost: 4,
	doAction: function(turn, done) {
		var selectcard = function(card) {
			if(card != 'done') {
				if(turn.game.deck.has(card) && turn.game.deck.cost(card) <= 5) {
					turn.handler.player.gain(turn.game.deck.take(card));
					done(true);
					return false;
				}
				else {
					turn.handler.message('card not available\n');
					return true;
				}
			}
			else {
				done(true);
				return false;
			}
		};
		turn.player.trash(this);
		turn.game.deck.trash(this);
		turn.handler.nextData = selectcard;
		turn.handler.message('choose a card costing up to 5 Treasure');
	}
});

actionCards.push(cards.feast);

cards.festival = new Class({
	Extends: Card,
	name: 'festival',
	description: '+2 Actions\n+1 Buy\n+2 Treasure',
	cost: 5,
	doAction: function(turn, done) {
		turn.addActions(2);
		turn.addBuys();
		turn.addTreasure(2);
		done();
	}
});

actionCards.push(cards.festival);

cards.laboratory = new Class({
	Extends: Card,
	name: 'laboratory',
	description: '+2 Cards\n+1 Action',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(2);
		turn.addActions();
		done();
	}
});

actionCards.push(cards.laboratory);

cards.witch = new Class({
	Extends: Card,
	name: 'witch',
	description: '+2 Cards\nEach other player gains a Curse card',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(2);
		if(turn.game.handlers.length > 1) {
			var start = turn.game.currentPlayer;
			var i = start;
			var next = function() {
				i = (start + 1) % (turn.game.handlers.length);
				if(i == start) {
					done();
					return;
				}
				if(turn.game.handlers[i].player.playsMoat(function(moat) {
					if(moat) {
						next.delay(0);
					}
					else {
						if(turn.game.deck.has('curse')) {
							turn.game.handlers[i].player.gain(turn.game.deck.take('curse'));
							next.delay(0);
						}
					}
				}));
			}
			next();
		}
	}
});

actionCards.push(cards.witch);

cards.spy = new Class({
	Extends: Card,
	name: 'spy',
	description: '+1 Card\n+1 Action\nEach player including you reveals the top '
		+ 'card of his deck and either discards or puts it back, your choice',
	cost: 4,
	doAction: function(turn, done) {
		var start = turn.game.currentPlayer;
		var i = start;
		var last = false;
		var next = function() {
			i = (i + 1) % (turn.game.handlers.length);
			if(i == start) {
				last = true;
			}
			var spy = function() {
				var h = turn.game.handlers[i];
				var card = h.player.reveal(true);
				var read = function(action) {
					if(action == 'keep') {
						h.player.addtodeck(card);
					}
					else {
						h.player.discard(card);
					}
					if(last) {
						done();
					}
					else {
						next.delay(0);
					}
					return false;
				};
				if(last) {
					turn.handler.message('should ' + h.player.name + ' keep or discard ' + card.name + '\n');
				}
				else {
					turn.handler.message('do you want to keep or discard ' + card.name + '\n');
				}
				turn.handler.nextData = read;
			};
			if(last) {
				spy();
			}
			else {
				h.player.playsMoat(function(moat) {
					if(moat) {
						next.delay(0);
					}
					else {
						spy();
					}
				});
			}
		}
		next();
	}
});

actionCards.push(cards.spy);

cards.chanceller = new Class({
	Extends: Card,
	name: 'chanceller',
	description: '+2 Treasure\hYou may immedietly put your deck into your discard pile.',
	cost: 3,
	doAction: function(turn, done) {
		turn.addTreasure(2);
		var read = function(action) {
			if(action == 'discard' || action == 'yes') {
				h.player.shuffle();
			}
			done();
			return false;
		}
		turn.handler.message('do you want to discard your deck\n');
		turn.handler.nextData = read;
	}
});

actionCards.push(cards.chanceller);

cards.workshop = new Class({
	Extends: Card,
	name: 'workshop',
	description: 'Gain a card costing up to 4 Treasure',
	cost: 3,
	doAction: function(turn, done) {
		var read = function(cardname) {
			if(cardname != 'skip') {
				if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= 4) {
					turn.player.gain(turn.game.deck.take(cardname));
				}
				else {
					turn.handler.message('that card is unavailable\n');
					return true;
				}
			}
			done();
			return false;
		}
		turn.handler.message('what do you want to gain\n');
		turn.handler.nextData = read;
	}
});

actionCards.push(cards.workshop);

cards.adventurer = new Class({
	Extends: Card,
	name: 'adventurer',
	description: 'Reveal cards from your deck until you reveal 2 Treasure cards.\n'
		+ 'Put these treasure cards into your hand and discard the other revealed cards.',
	cost: 6,
	doAction: function(turn, done) {
		var c, count = 0;
		do {
			c = turn.player.reveal();
			count = 0;
			if(c.treasure > 0) {
				count++;
				turn.player.addtohand(c, true);
			}
			else {
				turn.player.gain(c, true);
			}
		}
		while(count < 2);
		done();
	}
});

actionCards.push(cards.adventurer);

cards.remodel = new Class({
	Extends: Card,
	name: 'remodel',
	description: 'Trash a card from your hand.\nGain a card costing up to 2 Treasure more '
		+ 'than the trashed card.',
	cost: 4,
	doAction: function(turn, done) {
		var cost;
		var trash = function(cardname) {
			if(cardname != 'skip') {
				if(!turn.player.hand.some(function(card) { 
					if(card.name == cardname && card != this) {
						turn.player.trash(card);
						turn.game.deck.trash(card);
						cost = card.cost + 2;
						turn.handler.message('what do you want to gain, costing up to ' + cost + '\n');
						turn.handler.nextData = buy;
					}
				}, this)) {
					turn.handler.message('that card is unavailable\n');
					return true;
				}
			}
			return false;
		};
		var buy = function(cardname) {
			if(cardname != 'skip') {
				if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= cost) {
					turn.player.gain(turn.game.deck.take(cardname));
				}
				else {
					turn.handler.message('that card is unavailable\n');
					return true;
				}
			}
			done();
			return false;
		};
		turn.handler.message('what do you want to trash\n');
		turn.handler.nextData = trash;
	}
});

actionCards.push(cards.remodel);

cards.councilroom = new Class({
	Extends: Card,
	name: 'councilroom',
	description: '+4 Cards\n+1 Buy\nEach other player draws a card',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(4);
		turn.game.handlers.each(function(h) {
			if(h != turn.handler) {
				h.player.draw(1);
			}
		});
		done();
	}
});

actionCards.push(cards.councilroom);

cards.cellar = new Class({
	Extends: Card,
	name: 'cellar',
	description: '+1 Action\n Discard any number of cards.\n'
		+ '+1 Card per card discarded.',
	cost: 2,
	doAction: function(turn, done) {
		var count = 0;
		var selectcard = function(cardname) {
			if(cardname != 'skip') {
				if(turn.player.hand.some(function(card) {
					if(card.name == cardname && card != this) {
						turn.player.discardCard(card);
						return true;
					}
				}, this)) {
					count++;
				}
				else {
					turn.handler.message('you don\'t have this card\n');
				}
				return true;
			}
			else {
				turn.player.draw(count);
				done();
				return false;
			}
		};
		turn.handler.nextData = selectcard;
		turn.handler.message('which cards do you want to discard\nType skip if you are finished choosing');
	}
});

actionCards.push(cards.cellar);

cards.moat = new Class({
	Extends: Card,
	name: 'moat',
	description: '+2 Cards\nWhen another player plays an Attack card, you may\n'
		+ 'reveal this from your hand. If you do, you are unaffected by that Attack.',
	cost: 2,
	doAction: function(turn, done) {
		turn.player.draw(2);
		done();
	}
});

actionCards.push(cards.moat);

cards.village = new Class({
	Extends: Card,
	name: 'village',
	description: '+1 Card\n+2 Actions',
	cost: 3,
	doAction: function(turn, done) {
		turn.player.draw(1);
		turn.addActions(2);
		done();
	}
});

actionCards.push(cards.village);

cards.woodcutter = new Class({
	Extends: Card,
	name: 'woodcutter',
	description: '+1 Buy\n+2 Treaure',
	cost: 3,
	doAction: function(turn, done) {
		turn.addBuys();
		turn.addTreasure(2);
		done();
	}
});

actionCards.push(cards.woodcutter);

cards.militia = new Class({
	Extends: Card,
	name: 'militia',
	description: '+2 Treasure\nEach other player discards down to 3 cards in his hand.',
	cost: 4,
	doAction: function(turn, done) {
		turn.setTreasure(2);
		if(turn.game.handlers.length > 1) {
			var start = turn.game.currentPlayer;
			var i = start;
			var next = function() {
				i = (i + 1) % (turn.game.handlers.length);
				if(i == start) {
					done();
					return;
				}
				var h = turn.game.handlers[i];
				if(h.player.hand.length > 3) {
					if(h.player.playsMoat(function(moat) {
						if(moat) {
							next.delay(0);
						}
						else {
							var choose = function(cardname) {
								var ret;
								if(!h.player.hand.some(function(card) {
									if(card.name == cardname) {
										h.player.discardCard(card);
										if(h.player.hand.length > 3) {
											ret = true;
										}
										else {
											ret = false;
											next.delay(0);
										}
										return true;
									}
								}, this)) {
									h.nextData = choose;
									h.message('you don\'t have that card');
									return true;
								}
								return ret;
							};
							h.nextData = choose;
							h.message('you must discard cards until you have only 3');
							h.show(['show', 'hand']);
						}
					}));
				}
				else {
					next.delay(0);
				}
			}
			next();
		}
	}
});

actionCards.push(cards.militia);

cards.bureaucrat = new Class({
	Extends: Card,
	name: 'bureaucrat',
	description: 'Gain a Silver card; put it on top of your deck.\n'
		+ 'Each other player reveals a Victory card from his hand and puts it on his deck '
		+ '(or reveals a hand with no Victory cards)',
	cost: 4,
	doAction: function(turn, done) {
		if(turn.game.deck.has('silver')) {
			turn.addtodeck(turn.game.deck.take('silver'))
		}
		if(turn.game.handlers.length > 1) {
			var start = turn.game.currentPlayer;
			var i = start;
			var next = function() {
				i = (i + 1) % (turn.game.handlers.length);
				if(i == start) {
					done();
					return;
				}
				var h = turn.game.handlers[i];
				if(h.player.hand.some(function(card) {
					return card.getPoints || card.points > 0;
				})) { 				
					if(h.player.playsMoat(function(moat) {
						if(!moat) {
							h.player.hand.some(function(card) {
								if(card.getPoints || card.points > 0) {
									h.player.addtodeck(card);
								}
							});
						}
						next.delay(0);
					}));
				}
				else {
					next.delay(0);
				}
			}
			next();
		}
	}
});

actionCards.push(cards.bureaucrat);

cards.throneroom = new Class({
	Extends: Card,
	name: 'throneroom',
	description: 'Choose an Action card in your hand.\nPlay it twice.',
	cost: 4,
	doAction: function(turn, done) {
		var selectcard = function(cardname) {
			if(cardname != 'skip') {
				if(turn.player.hand.some(function(card) {
					if(card.name == cardname && card.doAction && card != this) {
						card.doAction(turn, function() {
							card.doAction(turn, function() {
								done();
							});
						});
						return true;
					}
				}, this)) {
					return false;
				}
				else {
					turn.handler.message('this card in unavailable\n');
					return true;
				}
			}
			else {
				done();
				return false;
			}
		};
		turn.handler.nextData = selectcard;
		turn.handler.message('what card do you want to play twice');
	}
});

actionCards.push(cards.throneroom);

cards.library = new Class({
	Extends: Card,
	name: 'library',
	description: 'Draw until you have 7 cards in hand.\nYou may set aside any Action cards '
		+ 'drawn this way, as you draw them; discard the set aside cards after you finish drawing.',
	cost: 4,
	doAction: function(turn, done) {
		var lib = function() {
			if(turn.player.hand.length < 7) {
				c = turn.player.reveal();
				if(c.doAction) {
					var ask = function(reply) {
						if(reply == 'keep') {
							turn.player.addtohand(c, true);
						}
						else {
							turn.player.discardCard(c, true);
						}
						lib.delay(0);
					};
					turn.handler.message('do you want to keep or discard ' + c.name + '\n');
					turn.handler.nextData = ask;
				}
				else {
					turn.player.addtohand(c, true);
					lib.delay(0);
				}
			}
			else {
				done();
			}
		};
	}
});

actionCards.push(cards.library);

cards.mine = new Class({
	Extends: Card,
	name: 'mine',
	description: 'Trash a Treasure card from your hand. Gain a treasure card costing up to 3 Treasure more; '
		+ 'put it into your hand',
	cost: 4,
	doAction: function(turn, done) {
		var cost;
		var gain = function(cardname) {
			if(cardname != 'skip') {
				if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= cost && turn.game.deck.isTreasure(cardname)) {
					turn.player.addtohand(turn.game.deck.take(cardname));
					done();
					return false;
				}
				else {
					turn.handler.message('you can\'t gain that card\n');
					return true;
				}
			}
			else {
				done();
			}
			return false;
		};
		var ask = function(cardname) {
			if(cardname != 'skip') {
				if(!turn.player.hand.some(function(card) {
					if(card.name == cardname && card.treasure > 0) {
						turn.player.trash(card);
						cost = card.cost + 3;
						turn.handler.message('which treasure card do you want to gain\n');
						turn.handler.nextData = gain;
						return true;
					}
				})) {
					turn.handler.message('you don\'t have a that card\n');
					return true;
				} 
			}
			else {
				done();
			}
			return false;
		};
		turn.handler.message('which treasure card do you want to discard\n');
		turn.handler.nextData = ask;
	}
});

actionCards.push(cards.mine);

cards.smithy = new Class({
	Extends: Card,
	name: 'smithy',
	description: '+3 Cards',
	cost: 4,
	doAction: function(turn, done) {
		turn.player.draw(3);
		done();
	}
});

actionCards.push(cards.smithy);

cards.market = new Class({
	Extends: Card,
	name: 'market',
	description: '+1 Card\n+1 Action\n+1 Buy\n+1 Treasure',
	cost: 5,
	doAction: function(turn, done) {
		turn.player.draw(1);
		turn.addActions();
		turn.addBuys();
		turn.addTreasure();
		done();
	}
});

actionCards.push(cards.market);