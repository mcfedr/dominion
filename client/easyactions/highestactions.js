/**
*   This file is part of dominion-client.
*   Copyright Fred Cox 2011
*
*   dominion-client is free software: you can redistribute it and/or modify
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
*    along with dominion-client.  If not, see <http://www.gnu.org/licenses/>.
*/

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
		else if(!this.status.buyPhase && this.status.actions > 0 && this.status.hand.some(function(card) {
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
				this.status.buyPhase = true;
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
