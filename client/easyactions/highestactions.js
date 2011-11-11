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
		this.parent.apply(this, arguments);
		this.ai.canbuy(cards);
	},
	
	finishedplaying: function() {
		this.parent.apply(this, arguments);
		this.ai.chooseaction();
	}
});

var name = 'highest_action';

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
			var highest, highestCost = -1, highestIndex;
			this.status.hand.each(function(card, index) {
				var c = theCards.getCard(card);
				if(c.cost > highestCost && c.doAction && this.supportedActions.contains(card)) {
					highest = card;
					highestIndex = index;
				}
			}, this);
			if(highest) {
				this.status.actions--;
				this.status.hand.splice(highestIndex, 1);
				this.client.play(highest);
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
		else if(this.status.actions > 0 && this.status.hand.some(function(card) {
			return !!theCards.getCard(card).doAction;
		})) {
			this.client.done();
		}
	},
	
	firstP: false,
	
	canbuy: function(cards) {
		var highest, highestCost = -1;
		cards.each(function(card) {
			var c = theCards.getCard(card);
			if(c.cost > highestCost && (c.treasure > 1 || card == 'province' || (this.firstP && (c.points > 0 || c.getPoints)) || this.supportedActions.contains(card))) {
				if(card == 'province') {
					this.firstP = true;
				}
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
