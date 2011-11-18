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
		this.ai.choosebuy();
	},
	
	canbuy: function(cards) {
		this.parent.apply(this, arguments);
		this.ai.canbuy(cards);
	}
});

var name = 'simple';

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
			if(c.treasure > 0 || c.points > 0 || c.getPoints) {
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
