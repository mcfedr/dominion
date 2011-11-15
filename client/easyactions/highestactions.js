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
				if(c.doAction && this.supportedActions.contains(card)) {
					if(c.cost > highestCost) {
						highest = [card];
						highestIndex = [index];
						highestCost = c.cost;
					}
					else if(c.cost == highestCost) {
						highest.push(card);
						highestIndex.push(index);
					}
				}
			}, this);
			if(highest) {
				this.status.actions--;
				var i = Math.floor(Math.random() * highest.length);
				var card = highest[i];
				this.status.hand.splice(highestIndex[i], 1);
				this.status.table.push(card);
				this.client.play(card);
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
		if(this.status.buys > 0) {
			var highest, highestCost = -1;
			cards.each(function(card) {
				var c = theCards.getCard(card);
				if(c.treasure > 1 || card == 'province' || (this.firstP && (c.points > 0 || c.getPoints)) || this.supportedActions.contains(card)) {
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
				var card = highest[Math.floor(Math.random() * highest.length)];
				this.client.buy(card);
				if(card == 'province') {
					this.firstP = true;
				}
				this.choosebuy();
			}
			else {
				this.client.done();
			}
		}
		else {
			this.choosebuy();
		}
	}
});

exports.AI.aiName = name;
