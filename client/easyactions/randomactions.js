var ai = require('./../basicai.js');
var theCards = require('./../../server/cards.js');
var rl = require('readline');

var handler = new Class({
	Extends: ai.BasicClientHandler,
	
	cash: function() {
		this.parent.apply(this, arguments);
		this.ai.chooseaction();
	},
	
	canbuy: function(cards) {
		this.ai.canbuy(cards);
	},
	
	finishedplaying: function() {
		this.ai.chooseaction();
	}
});

var name = 'random_actions';

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
	
	chooseaction: function() {
		if(this.status.actions > 0) {
			if(!this.status.hand.some(function(card) {
				var c = theCards.getCard(card);
				if(c.doAction && this.supportedActions.contains(card)) {
					this.status.actions--;
					this.status.hand.erase(card);
					this.client.play(card);
					return true;
				}
			}, this)) {
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
		else {
			this.client.done();
		}
	},
	
	canbuy: function(cards) {
		var highest, highestCost = -1;
		cards.each(function(card) {
			var c = theCards.getCard(card);
			if(c.cost > highestCost && (c.treasure > 0 || c.points > 0 || c.getPoints || this.supportedActions.contains(card))) {
				highest = card;
				highestCost = c.cost;
			}
		}, this);
		if(highest) {
			this.status.buys--;
			this.client.buy(highest);
			this.choosebuy();
		}
		else {
			this.client.done();
		}
	}
});

exports.AI.aiName = name;
