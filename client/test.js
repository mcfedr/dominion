var simple = require('./simple/simple.js');
var simplenocopper = require('./simple/simplenocopper.js');
var simplenocoppernoestate = require('./simple/simplenocoppernoestate.js');
var simplenocopperonlyprovince = require('./simple/simplenocopperonlyprovince.js');
var simplenocopperfirstprovince = require('./simple/simplenocopperfirstprovince.js');
var client = require('./client.js');

var host = 'localhost';

var handlers = {};

handlers[simple.name] = simple.Client;
handlers[simplenocopper.name] = simplenocopper.Client;
handlers[simplenocoppernoestate.name] = simplenocoppernoestate.Client;
handlers[simplenocopperonlyprovince.name] = simplenocopperonlyprovince.Client;
handlers[simplenocopperfirstprovince.name] = simplenocopperfirstprovince.Client;

var handlersLength = Object.getLength(handlers);

wins = {};
Object.each(handlers, function(h, name) {
	wins[name] = 0;
});

played = {};
Object.each(handlers, function(h, name) {
	played[name] = 0;
});

playersInGames = {
	2: 0,
	3: 0,
	4: 0
};

var gamesToRun = 1000;

var starts = gamesToRun;
var finishes = gamesToRun;

var start = function() {
	console.log('starting game ' + starts--);
	
	var thisgame = {};
	var possible = Object.keys(handlers);
	var name, chosen = 0;
	var players = 2 + Math.floor(Math.random() * 3);
	playersInGames[players]++;
	do {
		chosen++;
		i = Math.floor(Math.random() * possible.length);
		name = possible.splice(i, 1)[0];
		played[name]++;
		for(i = 0;i < 10;i++) {
			thisgame[name] = handlers[name];
		}
	}
	while(chosen < players);
	thisgameLength = Object.getLength(thisgame);
	
	var count = thisgameLength;
	
	var check = function() {
		if(--count == 0) {
			if(--finishes == 0) {
				finish();
			}
		}
	};
	
	var readys = thisgameLength;
	
	var ready = function() {
		if(--readys == 0) {
			running[0].client.start();
			if(starts > 0) {
				start();
			}
		}
	};
	
	var running = [];
	Object.each(thisgame, function(h, name) {
		var r = new h(host);
		r.on('welcome', ready);
		r.on('won', function(won) {
			if(won) {
				wins[name]++;
			}
			check();
		});
		running.push(r);
	});
	
	running.each(function(r) {
		new client.Client(r);
	});
};

var finish = function() {
	Object.each(wins, function(wins, name) {
		console.log(name + ' won ' + ((wins / played[name]) * 100).round(2) + '%');
	});
	Object.each(wins, function(wins, name) {
		console.log(name + ' won ' + wins);
	});
	Object.each(wins, function(wins, name) {
		console.log(name + ' played ' + played[name]);
	});
	Object.each(playersInGames, function(val, key) {
		console.log(val + ' ' + key + ' player games');
	});
};


start();