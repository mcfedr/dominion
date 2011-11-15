var ai = require('./../basicai.js');
var theCards = require('./../../server/cards.js');
var rl = require('readline');
var mongo = require('mongodb');

var handler = new Class({
	Extends: ai.BasicClientHandler,
	
	cash: function() {
		this.parent.apply(this, arguments);
		this.ai.chooseaction();
	},
	
	canbuy: function(cards) {
		this.parent.apply(this, arguments);
		this.ai.canbuy(cards);
	},
	
	finishedplaying: function() {
		this.parent.apply(this, arguments);
		this.ai.chooseaction();
	},
	
	winner: function(name) {
		this.parent.apply(this, arguments);
		this.ai.winner(this.won);
	},
});

var name = 'learning_second';

exports.AI = new Class({
	Extends: ai.BasicAI,
	
	handler: handler,
	name: name,
	supportedActions: [
		'festival',
		'laboratory',
		'witch',
		'adventurer',
		'councilroom',
		'moat',
		'village',
		'woodcutter',
		'bureaucrat',
		'smithy',
		'market'
	],
	
	initialize: function() {
		this.parent.apply(this, arguments);
		this.db = new DB();
	},
	
	chooseaction: function() {
		if(this.status.actions > 0) {
			var actionCards = this.status.hand.filter(function(card) {
				var c = theCards.getCard(card);
				return !!c.doAction && this.supportedActions.contains(card);
			}, this);			
			if(actionCards.length > 0) {
				var scores = {};
				actionCards.each(function(c) {
					scores[c] = 1;
				});
				scores.pass = 1;
				this.db.nearbyActionStatuses(this.getStatusSummary(), function(err, obj) {
					if(obj) {
						scores[obj.action.play] += obj.value;
					}
					else {
						console.log(scores);
						var min = 1, total = 0;
						Object.each(scores, function(val) {
							total += val;
							if(val < min) {
								min = val;
							}
						});
						if(min < 1) {
							total = 0;
							min++;
							Object.each(scores, function(val, k) {
								scores[k] += min;
								total += scores[k];
							});
						}
						var i = Math.floor(Math.random() * total), sofar = 0;
						Object.some(scores, function(val, c) {
							sofar += val;
							if(sofar > i) {
								if(c != 'pass') {
									this.status.actions--;
									this.status.hand.removeOne(c);
									this.status.table.push(c);
									this.chain.push(this.getActionChain(c));
									this.client.play(c);
									return true;
								}
								else {
									this.chain.push(this.getActionChain(c));
									this.choosebuy.delay(0, this);
									return true;
								}
							}
						}, this);
					}
				}.bind(this));
			}
			else {
				this.choosebuy();
			}
		}
		else {
			this.choosebuy();
		}
	},
	
	choosebuy: function() {
		if(this.status.buys > 0) {
			this.client.canbuy();
		}
		else if(!this.status.buyPhase && this.status.actions > 0 && this.status.hand.some(function(card) {
			return !!theCards.getCard(card).doAction;
		})) {
			this.client.done();
		}
	},
	
	canbuy: function(cards) {
		if(this.status.buys > 0) {
			if(cards.length > 0) {
				var i = Math.floor(Math.random() * cards.length);
				var c = cards[i];
				this.status.buys--;
				this.status.buyPhase = true;
				this.chain.push(this.getBuyChain(c));
				this.client.buy(c);
				this.choosebuy();
			}
			else {
				this.client.done();
			}
		}
		else {
			this.choosebuy();
		}
	},
	
	chain: [],
	
	getActionChain: function(card) {
		return {
			status: this.getStatusSummary(),
			action: {
				play: card
			},
			value: 0
		};
	},
	
	getBuyChain: function(card) {
		return {
			status: this.getStatusSummary(),
			action: {
				buy: card
			},
			value: 0
		};
	},
	
	getStatusSummary: function() {
		return {
			numCards: this.status.numCards,
			turn: this.status.turn,
			actionCards: this.status.hand.filter(function(card) {
				var c = theCards.getCard(card);
				return !!c.doAction && this.supportedActions.contains(card);
			}, this),
			cash: this.status.cash,
			buys: this.status.buys,
			actions: this.status.actions
		};
	},
	
	winner: function(won) {
		var f;
		if(won) {
			f = function(c) {
				c.value += 2;
			};
		}
		else {
			f = function(c) {
				c.value -= 1;
			}
		}
		this.chain.each(f);
		this.db.storeChain(this.chain);
		this.db.close();
	}
});

var DB = new Class({
	
	initialize: function() {
		this.client = new mongo.Db('learning_first', new mongo.Server("127.0.0.1", 27017, {}));
		this.client.open(function() {
			this.opened = true;
			this.onOpen.each(function(cb) {
				cb(this.client);
			}, this);
		}.bind(this));
	},
	
	onOpen: [],
	
	open: function(cb) {
		if(!this.opened) {
			this.onOpen.push(cb);
		}
		else {
			cb(this.client);
		}
	},
	
	close: function() {
		if(this.opened) {
			this.client.close();
		}
	},
	
	storeChain: function(chain) {
		this.open(function(client) {
			client.collection('chain', function(err, collection) {
				chain.each(function(c) {
					collection.update({status: c.status, action: c.action}, {$inc: {value: c.value}}, {upsert: true});
				});
			});
		});
	},
	
	nearbyActionStatuses: function(status, eachcb) {
		var query = {
			/*"status.numCards": { $gt: status.numCards - 5, $lt: status.numCards + 5 },
			"status.turn": { $gt: status.turn - 3, $lt: status.turn + 3 },*/
			"status.actionCards": {$all: status.actionCards},
			"action.play": {$in: status.actionCards}
		};
		var fields = {'value':1, 'action.play':1};
		this.open(function(client) {
			client.collection('chain', function(err, collection) {
				collection.find(query, fields).each(eachcb);
			});
		});
	},
	
	nearbyBuyStatuses: function(status, eachcb) {
		var query = {
			"status.numCards": { $gt: status.numCards - 5, $lt: status.numCards + 5 },
			"status.turn": { $gt: status.turn - 3, $lt: status.turn + 3 },
			"status.cash": status.cash,
			"status.buys": status.buys,
			"action.buy": {$exists: true},
		};
		var fields = {'value':1, 'action.buy':1};
		this.open(function(client) {
			client.collection('chain', function(err, collection) {
				collection.find(query, fields).each(eachcb);
			});
		});
	}
});

exports.AI.aiName = name;