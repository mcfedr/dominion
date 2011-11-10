var ai = require('./../basicai.js');
var theCards = require('./../../server/cards.js');
var rl = require('readline');

var handler = new Class({
	Extends: ai.BasicClientHandler,
	
	cash: function() {
		this.parent.apply(this, arguments);
		this.ai.choosebuy();
	},
	
	canbuy: function(cards) {
		this.parent.apply(this, arguments);
		this.ai.canbuy(cards);
	}
});

var name = 'simple_no_copper_only_province';

exports.AI = new Class({
	Extends: ai.BasicAI,
	
	handler: handler,
	name: name,
	supportedActions: [],
	
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
			if(c.cost > highestCost && (c.treasure > 1 || card == 'province')) {
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
