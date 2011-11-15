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

var name = 'simple_no_copper_no_estate';

exports.AI = new Class({
	Extends: ai.BasicAI,
	
	handler: handler,
	name: name,
	supportedActions: [],
	
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
		var highest, highestCost = -1;
		cards.each(function(card) {
			var c = theCards.getCard(card);
			if(c.treasure > 1 || c.points > 1 || c.getPoints) {
				if(c.cost > highestCost) {
					highest = [card];
					highestCost = c.cost;
				}
				else if(c.cost == highestCost) {
					highest.push(card);
				}
			}
		}, this);
		if(highest) {
			this.status.buys--;
			this.status.buyPhase = true;
			this.client.buy(highest[Math.floor(Math.random() * highest.length)]);
			this.choosebuy();
		}
		else {
			this.client.done();
		}
	}
});

exports.AI.aiName = name;
