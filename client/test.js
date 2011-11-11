var simple = require('./simple/simple.js');
var simplenocopper = require('./simple/simplenocopper.js');
var simplenocoppernoestate = require('./simple/simplenocoppernoestate.js');
var simplenocopperonlyprovince = require('./simple/simplenocopperonlyprovince.js');
var simplenocopperfirstprovince = require('./simple/simplenocopperfirstprovince.js');
var randomactions = require('./easyactions/randomactions.js');
var highestactions = require('./easyactions/highestactions.js');

var host = 'localhost';

var handlers = [
	simple.AI,
	simplenocopper.AI,
	simplenocoppernoestate.AI,
	simplenocopperonlyprovince.AI,
	simplenocopperfirstprovince.AI,
	randomactions.AI,
	highestactions.AI
];

wins = {};
played = {};
turns = {};
handlers.each(function(h) {
	wins[h.aiName] = 0;
	played[h.aiName] = 0;
	turns[h.aiName] = 0;
});

playersInGames = {
	2: 0,
	3: 0,
	4: 0
};

var gamesToRun = 1000;

var run = function() {

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
			played[h.aiName]++;
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
			var ai = new h(host);
			var ts = 0;
			ai.on('welcome', checkReady);
			ai.on('won', function(won) {
				if(won) {
					wins[h.aiName]++;
					turns[h.aiName] += ts;
				}
				checkEnded();
			});
			ai.on('turn', function() {
				ts++;
			});
			ais.push(ai);
		});
	};

	var finish = function() {
		Object.each(wins, function(wins, name) {
			console.log(name + ' won ' + ((wins / played[name]) * 100).round(2) + '%');
		});
		Object.each(wins, function(wins, name) {
			console.log(name + ' won with ' + (turns[name] / wins).round(2) + ' cards on average');
		});
		/*Object.each(wins, function(wins, name) {
			console.log(name + ' won ' + wins);
		});
		Object.each(wins, function(wins, name) {
			console.log(name + ' played ' + played[name]);
		});
		Object.each(playersInGames, function(val, key) {
			console.log(val + ' ' + key + ' player games');
		});*/
		run();
	};

	start();
};

run();