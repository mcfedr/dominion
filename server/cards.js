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

var cards = {};

var Card = new Class({
	name: 'blank',
	description: 'blank',
	cost: 0,
	treasure: 0,
	points: 0,
	attackedHandlers: function(turn, cb) {
		clearTimeout(turn.timeout);
		turn.handler.nextData = function() {
			turn.handler.message(this.name + ': waiting for other players\n');
			return true;
		};
		var handlers = [],
			start = turn.game.currentPlayer,
			i = (start + 1) % (turn.game.handlers.length);
		while(i != start) {
			handlers.push(turn.game.handlers[i]);
			i = (i + 1) % (turn.game.handlers.length);
		}
		var count = handlers.length + 1;
		var check = function() {
			if(--count == 0) {
				turn.resetTimeout();
				turn.handler.nextData = false;
				cb(handlers);
			}
		};
		handlers.each(function(h, index) {
			h.player.playsMoat(function(moat) {
				if(moat) {
					handlers.splice(index, 1);
				}
				check();
			});
		});
		check();
	},
	foreach: function(handlers, func, done) {
		var i = 0;
		var next = function() {
			i = (i + 1) % handlers.length;
			if(i == 0) {
				done();
			}
			else {
				func(handlers[i], next);
			}
		};
		if(handlers.length > 0) {
			func(handlers[i], next);
		}
		else {
			done();
		}
	}
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
		return some ? 'all the provinces have been bought' : empties >= 3 ? 'three piles are empty' : false;
	},
	
	describe: function() {
		return 'bank: ' + Object.reduce(this.cards, function(a, supply, name) {
			return (a ? a + ',' : '') + name + ' ' + supply.length;
		}) + '\n';
	},
	
	describeTrash: function() {
		if(this.trashed.length > 0) {
			return 'trash: ' + this.trashed.each(function(x, v, k) {
				return (x ? x + ',' : '') + v.name;
			}) + '\n';
		}
		else {
			return 'the trash is empty\n';
		}
	}
});

exports.describe = function(card) {
	if(cards[card]) {
		var c = new cards[card]();
		return c.name + ' (' + c.cost + ')\n' + c.description;
	}
	return false;
};

exports.getCost = function(card) {
	if(cards[card]) {
		return new cards[card]().cost;
	}
	return false;
};

exports.getCard = function(card) {
	if(cards[card]) {
		return new cards[card]();
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
		turn.handler.message(this.name + ': choose up to 4 cards to trash, skip when you are done\n');
		turn.handler.nextData = function(cardname) {
			if(cardname != 'skip') {
				if(turn.player.hand.some(function(card) {
					if(card.name == cardname) {
						turn.player.trash(card);
						turn.game.deck.trash(card);
						return true;
					}
				}, this)) {
					count++;
				}
				else {
					turn.handler.message(this.name + ': you don\'t have this card\n');
				}
				if(count < 4 && turn.player.hand.length > 0) {
					return true;
				}
				else {
					done();
					return false;
				}
			}
			else {
				done();
				return false;
			}
		}.bind(this);
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
		this.attackedHandlers(turn, function(others) {
			this.foreach(others, function(h, next) {
				var card1 = h.player.reveal();
				if(card1 && card1.treasure == 0) {
					h.player.gain(card1, true);
					card1 = null;
				}
				var card2 = h.player.reveal();
				if(card2 && card2.treasure == 0) {
					h.player.gain(card2, true);
					card2 = null;
				}
				if(card1 && card2) {
					turn.handler.message(this.name + ': you can gain either ' + card1.name + ' or ' + card2.name + ' or skip\n');
				}
				else if(card1) {
					turn.handler.message(this.name + ': you can gain either ' + card1.name + ' or skip\n');
				}
				else if(card2) {
					turn.handler.message(this.name + ': you can gain either ' + card2.name + ' or skip\n');
				}
				else {
					next.delay(0);
					return;
				}
				turn.handler.nextData = function(card) {
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
							turn.handler.message(this.name + ': you can\'t gain this card\n');
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
				}.bind(this);
			}.bind(this), done);
		}.bind(this));
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
		}
		done();
	}
});

actionCards.push(cards.moneylender);

cards.feast = new Class({
	Extends: Card,
	name: 'feast',
	description: 'Trash this card.\n Gain a card costing up to 5 Treasure',
	cost: 4,
	doAction: function(turn, done) {
		turn.player.trash(this, true);
		turn.game.deck.trash(this);
		if(Object.some(turn.game.deck.cards, function(cards, name) {
			return turn.game.deck.has(name) && turn.game.deck.cost(name) <= 5;
		})) {
			turn.handler.message(this.name + ': choose a card costing up to 5 treasure\n');
			turn.handler.nextData = function(card) {
				if(turn.game.deck.has(card) && turn.game.deck.cost(card) <= 5) {
					turn.handler.player.gain(turn.game.deck.take(card));
					done();
					return false;
				}
				else {
					turn.handler.message(this.name + ': card not available\n');
					return true;
				}
			}.bind(this);
		}
		else {
			done();
		}
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
		this.attackedHandlers(turn, function(others) {
			this.foreach(others, function(h, next) {
				if(turn.game.deck.has('curse')) {
					h.player.gain(turn.game.deck.take('curse'));
					next.delay(0);
				}
				else {
					done();
				}
			}, done);
		}.bind(this));
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
		var spy = function(h, next) {
			var card = h.player.reveal();
			if(card) {
				if(h == turn.handler) {
					turn.handler.message(this.name + ': do you want to keep or discard ' + card.name + '\n');
				}
				else {
					turn.handler.message(this.name + ': should ' + h.player.name + ' keep or discard ' + card.name + '\n');
				}
				turn.handler.nextData = function(action) {
					if(action == 'keep') {
						h.player.addtodeck(card);
					}
					else {
						h.player.gain(card);
					}
					next.delay(0);
					return false;
				};
			}
			else {
				next.delay(0);
			}
		}.bind(this);
		this.attackedHandlers(turn, function(others) {
			this.foreach(others, spy, function() {
				spy(turn.handler, done);
			});
		}.bind(this));
	}
});

actionCards.push(cards.spy);

cards.chancellor = new Class({
	Extends: Card,
	name: 'chancellor',
	description: '+2 Treasure\nYou may immedietly put your deck into your discard pile.',
	cost: 3,
	doAction: function(turn, done) {
		turn.addTreasure(2);
		turn.handler.message(this.name + ': do you want to discard your deck\n');
		turn.handler.nextData = function(action) {
			if(action == 'discard' || action == 'yes') {
				turn.player.shuffle();
			}
			done();
			return false;
		};
	}
});

actionCards.push(cards.chancellor);

cards.workshop = new Class({
	Extends: Card,
	name: 'workshop',
	description: 'Gain a card costing up to 4 Treasure',
	cost: 3,
	doAction: function(turn, done) {
		if(Object.some(turn.game.deck.cards, function(cards, name) {
			return turn.game.deck.has(name) && turn.game.deck.cost(name) <= 4;
		})) {
			turn.handler.message(this.name + ': what do you want to gain\n');
			turn.handler.nextData = function(cardname) {
				if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= 4) {
					turn.player.gain(turn.game.deck.take(cardname));
					done();
					return false;
				}
				else {
					turn.handler.message(this.name + ': that card is unavailable\n');
					return true;
				}
			}.bind(this);
		}
		else {
			done();
		}
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
		var hasMoreTreasure = function() {
			return turn.player.deck.concat(turn.player.discard).some(function(card) {
				return card.treasure > 0;
			});
		};
		var olddone = done, cardstodiscard = [];
		done = function() {
			cardstodiscard.each(function(c) {
				turn.player.gain(c);
			});
			olddone();
		}
		if(hasMoreTreasure()) {
			do {
				c = turn.player.reveal();
				if(c) {
					if(c.treasure > 0) {
						count++;
						turn.player.addtohand(c);
						if(!hasMoreTreasure()) {
							turn.player.shuffle();
							break;
						}
					}
					else {
						cardstodiscard.push(c);
					}
				}
			}
			while(count < 2 && c);
		}
		else {
			turn.player.shuffle();
		}
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
		if(turn.player.hand.length > 0) {
			turn.handler.message(this.name + ': what do you want to trash\n');
			turn.handler.nextData = function(cardname) {
				if(turn.player.hand.some(function(card) { 
					if(card.name == cardname) {
						turn.player.trash(card);
						turn.game.deck.trash(card);
						var cost = card.cost + 2;
						(function() {
							if(Object.some(turn.game.deck.cards, function(cards, name) {
								return turn.game.deck.has(name) && turn.game.deck.cost(name) <= cost;
							})) {
								turn.handler.message(this.name + ': what do you want to gain, costing up to ' + cost + '\n');
								turn.handler.nextData = function(cardname) {
									if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= cost) {
										turn.player.gain(turn.game.deck.take(cardname));
										done();
										return false;
									}
									else {
										turn.handler.message(this.name + ': that card is unavailable\n');
										return true;
									}
								}.bind(this);
							}
							else {
								done();
							}
						}).delay(0, this);
						return true;
					}
				}, this)) {
					return false;
				}
				else {
					turn.handler.message(this.name + ': that card is unavailable\n');
					return true;
				}
			}.bind(this);
		}
		else {
			done();
		}
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
		turn.handler.message(this.name + ': which cards do you want to discard\nskip if you are finished choosing\n');
		turn.handler.nextData = function(cardname) {
			if(cardname != 'skip') {
				if(!turn.player.hand.some(function(card) {
					if(card.name == cardname && card != this) {
						turn.player.discardCard(card);
						count++;
						return true;
					}
				}, this)) {
					turn.handler.message(this.name + ': you don\'t have this card\n');
				}
				if(turn.player.hand.length > 0) {
					return true;
				}
				else {
					turn.player.draw(count);
					done();
					return false;
				}
			}
			else {
				turn.player.draw(count);
				done();
				return false;
			}
		}.bind(this);
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
		turn.addTreasure(2);
		this.attackedHandlers(turn, function(others) {
			clearTimeout(turn.timeout);
			turn.handler.nextData = function() {
				turn.handler.message(this.name + ': waiting for other players\n');
				return true;
			}.bind(this);
			var count = others.length;
			var check = function() {
				if(count == 0) {
					turn.handler.nextData = false;
					turn.resetTimeout();
					done();
				}
			};
			others.each(function(h) {
				h.message(this.name + ': you must discard cards until you have only 3\n');
				h.show(['show', 'hand']);
				h.nextData = function(cardname) {
					var ret;
					if(!h.player.hand.some(function(card) {
						if(card.name == cardname) {
							h.player.discardCard(card);
							if(h.player.hand.length > 3) {
								ret = true;
							}
							else {
								ret = false;
								check();
							}
							return true;
						}
					}, this)) {
						h.nextData = choose;
						h.message(this.name + ': you don\'t have that card\n');
						return true;
					}
					return ret;
				}.bind(this);
			}, this);
		}.bind(this));
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
			turn.player.addtodeck(turn.game.deck.take('silver'))
		}
		this.attackedHandlers(turn, function(others) {
			this.foreach(others, function(h, next) {
				if(!h.player.hand.some(function(card) {
					if(card.getPoints || card.points > 0) {
						h.player.returntodeck(card);
						return true;
					}
				})) {
					var hand = h.player.hand.reduce(function(x, v, k) {
						return (x ? x + ',' : '')  + v.name;
					});
					turn.game.message(this.name + ': ' + h.player.name + ' reveals that his hand has no victory points: ' + hand + '\n', h);
					h.message(this.name + ': you reveal that you have no victory points\n');
				}
				next.delay(0);
			}.bind(this), done);
		}.bind(this));
	}
});

actionCards.push(cards.bureaucrat);

cards.throneroom = new Class({
	Extends: Card,
	name: 'throneroom',
	description: 'Choose an Action card in your hand.\nPlay it twice.',
	cost: 4,
	doAction: function(turn, done) {
		if(turn.player.hand.some(function(card) {
			return !!card.doAction;
		})) {
			turn.handler.message(this.name + ': what card do you want to play twice\n');
			turn.handler.nextData = function(cardname) {
				if(turn.player.hand.some(function(card) {
					if(card.name == cardname && card.doAction) {
						turn.game.message(this.name + ': ' + turn.player.name + ' played a  ' + cardname + ' with a throneroom\n', turn.handler);
						(function() {
							card.doAction(turn, function() {
								(function() {
									card.doAction(turn, done);
								}).delay(0);
							});
						}).delay(0);
						return true;
					}
				}, this)) {
					return false;
				}
				else {
					turn.handler.message(this.name + ': that card in unavailable\n');
					return true;
				}
			}.bind(this);
		}
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
		var olddone = done, cardstodiscard = [];
		done = function() {
			cards.each(function(c) {
				turn.player.gain(c);
			});
			olddone();
		};
		var next = function() {
			if(turn.player.hand.length < 7) {
				c = turn.player.reveal();
				if(c) {
					if(c.doAction) {
						turn.handler.message(this.name + ': do you want to keep or discard ' + c.name + '\n');
						turn.handler.nextData = function(reply) {
							if(reply == 'keep') {
								turn.player.addtohand(c, true, true);
							}
							else {
								cardstodiscard.push(c);
							}
							next.delay(0);
						};
					}
					else {
						turn.player.addtohand(c, false, true);
						next.delay(0);
					}
				}
				else {
					done();
				}
			}
			else {
				done();
			}
		}.bind(this);
		next();
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
		if(turn.player.hand.some(function(card) {
			return card.treasure > 0;
		})) {
			turn.handler.message(this.name + ': which treasure card do you want to trash\n');
			turn.handler.nextData = function(cardname) {
				if(!turn.player.hand.some(function(card) {
					if(card.name == cardname && card.treasure > 0) {
						turn.player.trash(card);
						var cost = card.cost + 3;
						(function() {
							if(Object.some(turn.game.deck.cards, function(cards, name) {
								return turn.game.deck.has(name) && turn.game.deck.cost(name) <= cost && turn.game.deck.isTreasure(name);
							})) {
								turn.handler.message(this.name + ': which treasure card do you want to gain, costing up to ' + cost + '\n');
								turn.handler.nextData = function(cardname) {
									if(turn.game.deck.has(cardname) && turn.game.deck.cost(cardname) <= cost && turn.game.deck.isTreasure(cardname)) {
										turn.player.addtohand(turn.game.deck.take(cardname));
										done();
										return false;
									}
									else {
										turn.handler.message(this.name + ': you can\'t gain that card\n');
										return true;
									}
								}.bind(this);
							}
							else {
								done();
							}
						}).delay(0, this);
						return true;
					}
				}, this)) {
					turn.handler.message(this.name + ': that card is unavailable\n');
					return true;
				}
				return false;
			}.bind(this);
		}
		else {
			done();
		}
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