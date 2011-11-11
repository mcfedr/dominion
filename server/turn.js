require('./mootools.js');
require('./functions.js');

exports.Turn = new Class({
	ended: false,
	initialize: function(game, handler, after) {
		this.game = game;
		this.handler = handler;
		this.after = after;
		this.player = this.handler.player;
		this.player.turns++;
		this.actions = 1;
		this.buys = 1;
		this.spent = 0;
		this.treasure = 0;
		this.handler.turn = this;
		this.handler.message('it\'s your turn\n');
		this.command(['show', 'status']);
		this.game.message('it\'s ' + this.player.name.possessive() + ' turn\n', this.handler);
		this.resetTimeout();
	},
	
	resetTimeout: function() {
		clearTimeout(this.timeout);
		this.timeout = (function() {
			this.handler.kicks++;
			if(this.handler.kicks <= 3) {
				this.handler.message('you took too long and have missed your turn\n');
				this.end();
				this.game.message(this.player.name + ' has missed a go\n', this.handler);
			}
			else {
				this.handler.message('you took too long and have been kicked\n');
				this.end();
				this.handler.end();
				this.game.message(this.player.name + ' has been kicked for taking too long\n');
			}
		}).delay(10000, this);
	},
	
	command: function(command) {
		var cardname;
		if(this.ended) {
			return false;
		}
		if(command[0] == 'done' || command[0] == 'finished') {
			this.end();
			return true;
		}
		else if(command[0] == 'show') {
			switch(command[1]) {
				case 'actions':
					this.handler.message(this.actions + '\n');
					return true;
				case 'buys':
					this.handler.message(this.buys + '\n');
					return true;
				case 'cash':
					this.handler.message(this.cash() + '\n');
					return true;
				case 'status':
					this.handler.show(['show', 'hand']);
					this.handler.message('actions: ' + this.actions + '\n'
						+ 'buys: ' + this.buys + '\n'
						+ 'cash: ' + this.cash() + '\n');
					return true;
				case 'canbuy':
					var cash = this.cash();
					var some = false;
					var buyingcards = [];
					Object.each(this.game.deck.cards, function(cards, name) {
						if(cards.length > 0) {
							if(cards[0].cost <= cash) {
								buyingcards.push(name);
							}
						}
					}, this);
					if(buyingcards.length > 0) {
						this.handler.message('canbuy: ' + buyingcards.reduce(function(x, v, k) {
							return (x ? x + ',' : '') + v;
						}) + '\n');
					}
					else {
						this.handler.message('you can\'t afford anything\n');
					}
					return true;
			}
		}
		else if(command[0] == 'buy') {
			cardname = command[1];
			if(this.buys > 0) {
				if(this.game.deck.has(cardname)) {
					var cost = this.game.deck.cost(cardname);
					if(cost <= this.cash()) {
						this.resetTimeout();
						this.spent += cost;
						this.buys--;
						this.player.gain(this.game.deck.take(cardname));
						this.checkEnd();
					}
					else {
						this.handler.message(cardname + ' is too expensive\n');
					}
				}
				else {
					this.handler.message(cardname + ' is not available\n');
				}
			}
			else {
				this.handler.message('you don\'t have any buys\n');
			}
			return true;
		}
		else if(command[0] == 'play') {
			cardname = command[1];
			if(this.actions > 0) {
				if(!this.player.hand.some(function(card) {
					if(card.name == cardname) {
						if(card.doAction) {
							this.resetTimeout();
							this.actions--;
							this.player.play(card);
							card.doAction(this, function() {
								this.checkEnd();
								this.handler.message('you finished playing ' + cardname + '\n');
								this.game.message(this.player.name + ' finished playing ' + cardname + '\n', this.handler);
							}.bind(this));
						}
						else {
							this.handler.message(cardname + ' isn\'t an action card\n');
						}
						return true;
					}
				}, this)) {
					this.handler.message('you don\'t have this card\n');
				}
			}
			else {
				this.handler.message('you don\'t have any actions\n');
			}
			return true;
		}
		return false;
	},
	
	addBuys: function(count) {
		count = count || 1;
		this.buys += count;
		this.handler.message('you have ' + count + ' more buy' + (count > 1 ? 's' : '') + '\n');
	},
	
	addActions: function(count) {
		count = count || 1;
		this.actions += count;
		this.handler.message('you have ' + count + ' more action' + (count > 1 ? 's' : '') + '\n');
	},
	
	addTreasure: function(count) {
		count = count || 1;
		this.treasure += count;
		this.handler.message('you have ' + count + ' more cash\n');
	},
	
	cash: function() {
		var t = this.treasure;
		this.player.hand.each(function(card) {
			t += card.treasure;
		});
		return t - this.spent;
	},
	
	checkEnd: function() {
		if(!this.game.checkEnd()) {
			if(this.buys == 0 && (this.actions == 0 || !this.player.hand.some(function(card) {
				return !!card.doAction;
			}))) {
				this.end();
			}
		}
	},
	
	end: function(gameend) {
		clearTimeout(this.timeout);
		if(!gameend) {
			this.handler.message('your turn has finished\n');
			this.game.message(this.player.name + ' has finished his turn\n', this.handler);
			this.player.discardHand();
			this.player.draw();
			this.after.delay(0);
		}
		this.ended = true;
		this.handler.turn = null;
	}
});