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
*    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/

var simple = require('./simple/simple.js');
var simplenocopper = require('./simple/simplenocopper.js');
var simplenocoppernoestate = require('./simple/simplenocoppernoestate.js');
var simplenocopperonlyprovince = require('./simple/simplenocopperonlyprovince.js');
var simplenocopperfirstprovince = require('./simple/simplenocopperfirstprovince.js');
var randomactions = require('./easyactions/randomactions.js');
var highestactions = require('./easyactions/highestactions.js');
var first = require('./learning/first.js');
var second = require('./learning/second.js');

var host = 'localhost';

var handlers = [
	simple.AI,
	simplenocopper.AI,
	simplenocoppernoestate.AI,
	simplenocopperonlyprovince.AI,
	simplenocopperfirstprovince.AI,
	randomactions.AI,
	highestactions.AI,
	first.AI,
	second.AI
];

wins = {};
points = {};
played = {};
turns = {};
cards = {};
winssize = {};
playedsize = {};
turnssize = {};
cardssize = {};
handlers.each(function(h) {
	wins[h.aiName] = 0;
	points[h.aiName] = 0;
	played[h.aiName] = 0;
	turns[h.aiName] = 0;
	cards[h.aiName] = 0;
	winssize[h.aiName] = {
		2: 0,
		3: 0,
		4: 0
	};
	playedsize[h.aiName] = {
		2: 0,
		3: 0,
		4: 0
	};
	turnssize[h.aiName] = {
		2: 0,
		3: 0,
		4: 0
	};
	cardssize[h.aiName] = {
		2: 0,
		3: 0,
		4: 0
	};
});

playersInGames = {
	2: 0,
	3: 0,
	4: 0
};

var gamesToRun = 1000;
var runsToRun = 10;

var runs = 0;

var run = function() {
	runs++;

	var starts = 0;
	var finishes = 0;

	var start = function() {
		starts++;
		//console.log('games left to start: ' + starts);
		//choose number of players
		var players = 2 + Math.floor(Math.random() * 3);
		playersInGames[players]++;
	
		//choose players
		var gameplayers = [];
		var chosen = 0, i, h, num = 0;
		do {
			chosen++;
			i = Math.floor(Math.random() * handlers.length);
			h = handlers[i];
			if(!gameplayers.contains(h)) {
				played[h.aiName]++;
				playedsize[h.aiName][players]++;
			}
			gameplayers.push(h);
		}
		while(chosen < players);
	
		//checks when all the players have finished
		var ended = gameplayers.length;
		var checkEnded = function() {
			if(--ended == 0) {
				//console.log('games left to finish ' + finishes);
				if(++finishes == gamesToRun) {
					finish();
				}
			}
		};
	
		//checks when all the players are ready to start
		var readys = gameplayers.length;
		var checkReady = function() {
			if(--readys == 0) {
				if(players < 4) {
					ais[0].client.start();
				}
				if(starts < gamesToRun) {
					start();
				}
			}
		};
	
		var ais = [];
		gameplayers.each(function(h) {
			var ai = new h(host/*, false, true, true*/);
			ai.on('welcome', checkReady);
			ai.on('won', function(won, status) {
				if(won) {
					points[h.aiName] += players;
					wins[h.aiName]++;
					turns[h.aiName] += status.turns;
					cards[h.aiName] += status.numCards;
					winssize[h.aiName][players]++;
					turnssize[h.aiName][players] += status.turns;
					cardssize[h.aiName][players] += status.numCards;
				}
				else {
					points[h.aiName] -= players;
				}
				var c = status.deck.length + status.discard.length + status.hand.length + status.table.length;
				if(c != status.numCards) {
					console.log('wrong cards', c, status);
				}
				checkEnded();
			});
			ais.push(ai);
		});
	};

	var finish = function() {
		console.log('------ Finished Run ' + runs + ' ------');
		Object.each(points, function(points, name) {
			console.log(name + ': ' + points);
		});
		if(!runsToRun || runs < runsToRun) {
			say('finished run ' + runs);
			stats();
			run();
		}
		else {
			say('finished everything');
			stats();
		}
	};

	start();
};

run();

var stats = function() {
	Object.each(wins, function(wins, name) {
		if(played[name] > 0) {
			var m = name;
			m += '\n\tOverall';
			m += ' wins: ' + ((wins / played[name]) * 100).round(2) + '% of '
				+ played[name];
			if(wins > 0) {
				m += ' turns: ' + (turns[name] / wins).round(2);
				m += ' cards: ' + (cards[name] / wins).round(2);
				Object.each(winssize[name], function(wins, size) {
					if(wins > 0) {
						m += '\n\t' + size + ' Player';
						m += ' wins: ' + ((wins / playedsize[name][size]) * 100).round(2) + '% of '
							+ playedsize[name][size];
						m += ' turns: ' + (turnssize[name][size] / wins).round(2);
						m += ' cards: ' + (cardssize[name][size] / wins).round(2);
					}
				});
			}
			console.log(m);
		}
		else {
			console.log(name + ' didn\'t play');
		}
	});
}

var say = function(what) {
	require('child_process').spawn('say', [what]);
}