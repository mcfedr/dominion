require('./mootools.js');
var player = require('./player.js');
var cards = require('./cards.js');

String.prototype.possessive = function() {
	if(this.charAt(this.length - 1) != 's') {
		return this + '\'s';
	}
	return this + '\'';
};

var gamenum = 0;

var Game = new Class({
	handlers: [],
	started: false,
	ended: false,
	currentPlayer: -1,
	
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
		this.message(this.deck.describe());
		
		//deal
		this.handlers.each(function(h) {
			for(var i = 0;i < 3;i++) {
				h.player.gain(this.deck.take('estate'), true);
			}
			for(i = 0;i< 7;i++) {
				h.player.gain(this.deck.take('copper'), true);
			}
			h.player.draw();
		}, this);
		
		//start the first turn
		this.turn.delay(0, this);
	},
	
	turn: function() {
		if(this.handlers.length > 0) {
			this.currentPlayer = (this.currentPlayer + 1) % this.handlers.length;
			var turn = new Turn(this, this.handlers[this.currentPlayer], this.turn.bind(this));
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
			else if(commands[1] == 'game') {
				if(!this.started) {
					this.message('game hasn\'t been started yet\n');
				}
				else {
					this.message('game started at ' + this.started + '\n'
						+ 'it\'s currently ' + this.handlers[this.currentPlayer].player.name.possessive() + ' turn');
				}
				return true;
			}
			else if(commands[1] == 'players') {
				this.handlers.each(function(h, index) {
					if(h.player) {
						handler.message(h.player.name + (this.currentPlayer == index ? '*' : '') + '\n');
					}
				}, this);
				return true;
			}
			/*else if(commands[1] == 'player') {
				return this.handlers.some(function(h) {
					if(h.player.name == commands[2]) {
						this.message(h.player.describe());
						return true;
					}
				}, this);
			}*/
		}
		return false;
	},
	
	checkStart: function() {
		if(this.handlers.length == 4) {
			this.start.delay(0, this);
		}
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
		this.handler.message('it\'s your turn\n');
		this.command(['show', 'status']);
		this.handler.message('\n');
		this.game.message('it\'s ' + this.player.name.possessive() + ' turn\n', this.handler);
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
				case 'status':
					this.handler.show(['show', 'hand']);
					this.handler.message('actions: ' + this.actions + '\n'
						+ 'buys: ' + this.buys + '\n'
						+ 'cash: ' + this.cash() + '\n');
					return true;
				case 'canbuy':
					var cash = this.cash();
					var some = false;
					Object.each(this.game.deck.cards, function(cards, name) {
						if(cards.length > 0) {
							if(cards[0].cost <= cash) {
								this.handler.message(name + ' (' + cards[0].cost + ')\n');
								some = true;
							}
						}
					}, this);
					if(!some) {
						this.handler.message('you can\'t afford anything\n');
					}
					return true;
			}
		}
		else if(command[0] == 'buy') {
			cardname = command[1];
			if(this.buys > 0) {
				if(this.game.deck.has(cardname)) {
					var cost = this.game.deck.cost(cardname);
					if(cost <= this.cash()) {
						this.resetTimeout();
						this.spent += cost;
						this.buys--;
						this.player.gain(this.game.deck.take(cardname));
						this.checkEnd();
					}
					else {
						this.handler.message(cardname + ' is too expensive\n');
					}
				}
				else {
					this.handler.message(cardname + ' is not available\n');
				}
			}
			else {
				this.handler.message('you don\'t have any buys\n');
			}
			return true;
		}
		else if(command[0] == 'play') {
			cardname = command[1];
			if(this.actions > 0) {
				if(!this.player.hand.some(function(card) {
					if(card.name == cardname) {
						if(card.doAction) {
							this.resetTimeout();
							this.actions--;
							this.player.play(card);
							card.doAction(this, function() {
								this.checkEnd();
							}.bind(this));
						}
						else {
							this.handler.message(cardname + ' isn\'t an action card\n');
						}
						return true;
					}
				}, this)) {
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
	
	addBuys: function(count) {
		count = count || 1;
		this.buys += count;
		this.handler.message('you have ' + count + ' more buy' + (count > 1 ? 's' : '') + '\n');
	},
	
	addActions: function(count) {
		count = count || 1;
		this.actions += count;
		this.handler.message('you have ' + count + ' more action' + (count > 1 ? 's' : '') + '\n');
	},
	
	addTreasure: function(count) {
		count = count || 1;
		this.treasure += count;
		this.handler.message('you have ' + count + ' more cash\n');
	},
	
	cash: function() {
		var t = this.treasure;
		this.player.hand.each(function(card) {
			t += card.treasure;
		});
		return t - this.spent;
	},
	
	checkEnd: function() {
		if(!this.game.checkEnd()) {
			if(this.buys == 0 && (this.actions == 0 || !this.player.hand.some(function(card) {
				return !!card.doAction;
			}))) {
				this.end();
			}
		}
	},
	
	end: function() {
		clearTimeout(this.timeout);
		this.handler.message('your turn has finished\n');
		this.game.message(this.player.name + ' has finished his turn\n', this.handler);
		this.ended = true;
		this.player.discardHand();
		this.player.draw();
		this.handler.turn = null;
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
			this.message('welcome ' + this.player.name + '\n'
				+ 'you have joined game ' + this.game.gamenum+ '\n'
				+ 'type help for a list of commands\n\n');
			this.game.checkStart();
			return false;
		};
		
		this.message("hello\nwhat is your name?\n");
	},
	
	buffer: '',
	
	data: function(data) {
		data = this.buffer + data;
		if(data.length == 0 || data.charAt(data.length - 1) != '\n') {
			this.buffer += data;
			return;
		}
		this.buffer = '';
		data = data.trim();
		if(data == '') {
			return;
		}
		var lines = data.split('\n');
		if(lines.length > 1) {
			lines.each(this.data.bind(this));
			return;
		}
		if(this.player) {
			console.log(this.player.name + '<-' + data.replace(/\n/g, ' '));
		}
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
					var desc = cards.describe(commands[1]);
					if(desc) {
						this.message(desc + '\n');
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
			case 'hand':
				some = false;
				this.player.hand.each(function(card) {
					this.message(card.name + '\n');
					some = true;
				}, this);
				if(!some) {
					this.message('you have no cards in your hand\n');
				}
				return true;
			case 'table':
				some = false;
				this.player.table.each(function(card) {
					this.message(card.name + '\n');
					some = true;
				}, this);
				if(!some) {
					this.message('you haven\'t played any cards yet\n');
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
			+ 'show canbuy - show the cards you can afford\n'
			+ 'show status - a summary of this infomation\n'
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
