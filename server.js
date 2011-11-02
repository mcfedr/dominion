require('mootools');
var player = require('./player.js');
var cards = require('./cards.js');

var gamenum = 0;

var Game = new Class({
	handlers: [],
	started: false,
	ended: false,
	nextPlayer: -1,
	
	initialize: function() {
		this.gamenum = gamenum++;
	},
	
	start: function() {
		console.log('starting game ' + this.gamenum);
		this.started = new Date();
		this.message('the game has started\n');
		
		//shuffle the players
		var tmp = this.handlers;
		this.handlers = [];
		var i;
		do {
			i = Math.floor(Math.random() * tmp.length);
			this.handlers.push(tmp.splice(i, 1)[0]);
		}
		while(tmp.length > 0);
		
		this.deck = new cards.Deck(this.handlers.length);
		
		//deal
		this.handlers.each(function(h) {
			for(var i = 0;i < 3;i++) {
				h.player.gain(this.deck.take('estate'));
			}
			for(i = 0;i< 7;i++) {
				h.player.gain(this.deck.take('copper'));
			}
			h.player.draw();
		}, this);
		
		//start the first turn
		this.turn.delay(0, this);
	},
	
	turn: function() {
		if(this.handlers.length > 0) {
			this.nextPlayer = (this.nextPlayer + 1) % this.handlers.length;
			var turn = new Turn(this, this.handlers[this.nextPlayer], this.turn.bind(this));
		}
		else {
			this.end();
		}
	},
	
	message: function(message, noth) {
		this.handlers.each(function(h) {
			if(h != noth && h.player) {
				h.message(message);
			}
		});
	},
	
	command: function(commands, handler) {
		if(commands[0] == 'start') {
			if(!this.started) {
				this.start();
			}
			else {
				handler.message('the game has already started\n');
			}
			return true;
		}
		else if(commands[0] == 'show') {
			if(commands[1] == 'bank' && this.deck) {
				handler.message(this.deck.describe());
				return true;
			}
			else if(commands[1] == 'trash' && this.deck) {
				handler.message(this.deck.describeTrash());
				return true;
			}
		}
		return false;
	},
	
	checkEnd: function() {
		if(this.deck.shouldEnd()) {
			var winner = 'nobody', winningScore = 0;
			this.handlers.each(function(h) {
				var s = h.player.score();
				if(s > winningScore) {
					winner = h.player.name;
					winningScore = s;
				}
				this.message(h.player.name + ': ' + s + '\n');
			}, this);
			this.message('The winner is ' + winner + '\n');
			this.end();
			return true;
		}
		return false;
	},
	
	end: function() {
		console.log('finished game ' + this.gamenum);
		this.ended = true;
		this.message('the game has finished\n');
		this.handlers.each(function(h) {
			h.end();
		});
	}
});

var Turn = new Class({
	ended: false,
	initialize: function(game, handler, after) {
		this.game = game;
		this.handler = handler;
		this.after = after;
		this.player = this.handler.player;
		this.actions = 1;
		this.buys = 1;
		this.spent = 0;
		this.treasure = 0;
		this.handler.turn = this;
		this.handler.message('its your turn\n');
		this.handler.show(['show', 'hand']);
		this.handler.message('\n');
		this.game.message('its ' + this.player.name + '\'s turn\n', this.handler);
		this.resetTimeout();
	},
	
	resetTimeout: function() {
		clearTimeout(this.timeout);
		this.timeout = (function() {
			this.handler.kicks++;
			if(this.handler.kicks <= 3) {
				this.handler.message('you took too long and have missed your turn\n');
				this.end();
				this.game.message(this.player.name + ' has missed a go\n', this.handler);
			}
			else {
				this.handler.message('you took too long and have been kicked\n');
				this.end();
				this.handler.end();
				this.game.message(this.player.name + ' has been kicked for taking too long\n');
			}
		}).delay(60000, this);
	},
	
	command: function(command) {
		var card;
		if(this.ended) {
			return false;
		}
		this.resetTimeout();
		if(command[0] == 'done' || command[0] == 'finished') {
			this.end();
			return true;
		}
		else if(command[0] == 'show') {
			switch(command[1]) {
				case 'actions':
					this.handler.message(this.actions + '\n');
					return true;
				case 'buys':
					this.handler.message(this.buys + '\n');
					return true;
				case 'cash':
					this.handler.message(this.cash() + '\n');
					return true;
			}
		}
		else if(command[0] == 'buy') {
			card = command[1];
			if(this.buys > 0) {
				if(this.game.deck.has(card)) {
					var cost = this.game.deck.cost(card);
					if(cost <= this.cash()) {
						this.spent += cost;
						this.buys--;
						this.player.gain(this.game.deck.take(card));
						this.handler.message('you bought a ' + card + '\n');
						this.game.message(this.player.name + ' bought a ' + card + '\n', this.handler);
						this.checkEnd();
					}
					else {
						this.handler.message(card + ' is too expensive\n');
					}
				}
				else {
					this.handler.message(card + ' is not available\n');
				}
			}
			else {
				this.handler.message('you don\'t have any buys\n');
			}
			return true;
		}
		else if(command[0] == 'play') {
			card = command[1];
			if(this.actions > 0) {
				var hcard;
				this.player.hand.some(function(hc) {
					if(!hc.played && hc.card.name == card) {
						hcard = hc;
						return true;
					}
				});
				if(hcard) {
					if(hcard.card.doAction) {
						hcard.card.doAction(this, function(out) {
							this.actions--;
							hcard.played = true;
							this.handler.message('you played a ' + card + '\n' + (out ? '\n' : ''));
							this.game.message(this.player.name + ' played a ' + card + '\n', this.handler);
							this.checkEnd();
						}.bind(this));
					}
					else {
						this.handler.message(card + ' isn\'t an action card\n');
					}
				}
				else {
					this.handler.message('you don\'t have this card\n');
				}
			}
			else {
				this.handler.message('you don\'t have any actions\n');
			}
			return true;
		}
		return false;
	},
	
	cash: function() {
		var t = this.treasure;
		this.player.hand.each(function(hcard) {
			t += hcard.card.treasure;
		});
		return t - this.spent;
	},
	
	checkEnd: function() {
		if(!this.game.checkEnd()) {
			var hasActionCard = this.player.hand.some(function(hcard) {
				return hcard.card.doAction;
			});
			if(this.buys == 0 && (!hasActionCard || this.actions == 0)) {
				this.end();
			}
		}
	},
	
	end: function() {
		clearTimeout(this.timeout);
		this.ended = true;
		this.player.discardHand();
		this.player.draw();
		this.handler.turn = null;
		this.handler.message('your turn has finished\n');
		this.game.message(this.player.name + ' has finished his turn\n', this.handler);
		this.after.delay(0);
	}
});

var PlayerHandler = new Class({
	kicks: 0,
	ended: false,
	initialize: function(socket) {
		this.socket = socket;
		socket.setEncoding('utf8');
		socket.on('data', this.data.bind(this));
		socket.on('end', this.remove.bind(this));
		socket.on('error', this.remove.bind(this));
		
		this.nextData = function(name) {
			this.player = new player.Player(name);
			this.player.handler = this;
			if(opengame.started) {
				opengame = new Game();
			}
			opengame.handlers.push(this);
			this.game = opengame;
			console.log(this.player.name + '--connected');
			this.message('Welcome ' + this.player.name + '\n'
				+ 'You have joined game ' + this.game.gamenum+ '\n'
				+ 'Type help for a list of commands\n\n');
			return false;
		};
		
		this.message("Hi\nWhat is your name?\n");
	},
	
	data: function(data) {
		data = data.trim();
		if(this.player) {
			console.log(this.player.name + '<-' + data.replace(/\n/g, ' '));
		}
		//console.log('got data:' + data);
		if(this.nextData) {
			if(!this.nextData(data)) {
				this.nextData = false;
			}
		}
		else {
			var commands = data.split(' ');
			switch(commands[0]) {
				case 'help':
				case '?':
				case 'commands':
					this.help();
					break;
				case 'quit':
				case 'exit':
					this.end();
					return;
				case 'show':
					if(this.show(commands)) {
						break;
					}
				case 'describe':
					if(cards[commands[1]]) {
						this.message(new cards[commands[1]]().description + '\n');
						break;
					}
				default:
					if(this.turn) {
						if(this.turn.command(commands)) {
							break;
						}
					}
					if(this.game.command(commands, this)) {
						break;
					}
					this.message('invalid command\n');
			}
			this.message('\n');
		}
	},
	
	show: function(commands) {
		var some, type;
		switch(commands[1]) {
			case 'game':
				if(!this.game.started) {
					this.message('game hasn\'t been started yet\n');
				}
				else {
					this.message('game started at ' + this.game.started
						+ 'its currently ' + this.game.handlers[this.game.nextPlayer] + '\'s turn');
				}
				return true;
			case 'players':
				some = false;
				this.game.handlers.each(function(h) {
					if(h != this && h.player) {
						this.message(h.player.name + '\n');
						some = true;
					}
				}, this);
				if(!some) {
					this.message('no other players\n');
				}
				return true;
			case 'hand':
			case 'table':
				some = false;
				type = commands[1] == 'table';
				if(type && !this.turn) {
					return false;
				}
				this.player.hand.each(function(hcard) {
					if(type == hcard.played) {
						this.message(hcard.card.name + '\n');
						some = true;
					}
				}, this);
				if(!some) {
					if(type) {
						this.message('you haven\'t played any cards yet\n');
					}
					else {
						this.message('you have no cards in your hand\n');
					}
				}
				return true;
			case 'commands':
				this.help();
				return true;
			default:
				return false;
		}
	},
		
	help: function() {
		this.message('Here are some commands you can type\n'
			+ 'help - show this help message\n'
			+ 'start - start the game\n'
			+ 'show players - show a list of connected players\n'
			+ 'show game - show info about the game state\n'
			+ 'show bank - show the currect game bank\n'
			+ 'show trash - show the trash\n'
			+ 'show hand - list the cards currently in your hand\n'
			+ 'describe [card] - describe what [card] does\n'
			+ 'during your turn:\n'
			+ 'show actions - the number of actions you have left\n'
			+ 'show buys - the number of buys you have left\n'
			+ 'show table - show the cards you have played\n'
			+ 'buy [card] - buy a card\n'
			+ 'play [card] - play a card in your hand\n'
			+ 'done - to finish your turn\n'
			+ 'quit\n');
	},
	
	message: function(message) {
		if(!this.ended) {
			if(this.player && message != '' && message != '\n') {
				console.log(this.player.name + '->' + message.replace(/\n/g, ' '));
			}
			this.socket.write(message);
		}
	},
	
	end: function() {
		this.socket.end('Bye\n');
		this.remove();
		if(this.player) {
			console.log(this.player.name + '--disconnected');
		}
	},
	
	remove: function() {
		this.ended = true;
		if(this.player) {
			if(this.turn) {
				this.turn.end();
			}
			this.game.handlers.erase(this);
		}
	}
});

var net = require('net');

var opengame = new Game();

var server = net.createServer(function(socket) {
	new PlayerHandler(socket);
});

server.listen(5678);
var address = server.address();
console.log('Server started on ' + address.address + ':' + address.port);
