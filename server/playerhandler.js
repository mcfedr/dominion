require('./mootools.js');
require('./functions.js');
var game = require('./game.js');
var player = require('./player.js');
var cards = require('./cards.js');

var opengame;

exports.PlayerHandler = new Class({
	kicks: 0,
	ended: false,
	initialize: function(socket, log) {
		this.socket = socket;
		this.log = log;
		socket.setEncoding('utf8');
		socket.on('data', this.data.bind(this));
		socket.on('end', this.remove.bind(this));
		socket.on('error', this.remove.bind(this));
		
		this.nextData = function(name) {
			if(!opengame || opengame.started) {
				opengame = new game.Game(this.log);
			}
			if(name && name.search(/^\w+$/) != -1 && !opengame.handlers.some(function(handler) {
				return handler.player.name == name;
			})) {
				this.player = new player.Player(name);
				this.player.handler = this;
				
				opengame.handlers.push(this);
				this.game = opengame;
				this.log(':' + this.game.gamenum + ':' + this.player.name + '--connected');
				this.message('welcome ' + this.player.name + ', '
					+ 'you have joined game ' + this.game.gamenum+ ', '
					+ 'type help for a list of commands\n');
				this.game.checkStart();
				return false;
			}
			else {
				this.message('that is not a valid name\n');
				return true;
			}
		};
		
		this.message("hello\nwhat is your name\n");
	},
	
	buffer: '',
	
	data: function(data) {
		data = this.buffer + data;
		if(data.length == 0 || data.charAt(data.length - 1) != '\n') {
			this.buffer = data;
			return;
		}
		this.buffer = '';
		data = data.trim();
		if(data == '') {
			return;
		}
		var lines = data.split('\n');
		if(lines.length) {
			lines.each(function(l) {
				this.line(l);
			}, this);
		}
	},
	
	line: function(data) {
		data = data.trim();
		if(this.player) {
			this.log(':' + this.game.gamenum + ':' + this.player.name + '<-' + data.replace(/\n/g, '\\n'));
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
		}
	},
	
	show: function(commands) {
		var some, type;
		switch(commands[1]) {
			case 'hand':
				if(this.player.hand.length > 0) {
					this.message('hand: ' + this.player.hand.reduce(function(x, v, k) {
						return (x ? x + ',' : '') + v.name;
					}) + '\n');
				}
				else {
					this.message('you have no cards in your hand\n');
				}
				return true;
			case 'table':
				if(this.player.table.length > 0) {
					this.message('table: ' + this.player.hand.reduce(function(x, v, k) {
						return (x ? x + ',' : '') + v.name;
					}) + '\n');
				}
				else {
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
			try {
				if(this.player && message != '' && message != '\n') {
					this.log(':' + this.game.gamenum + ':' + this.player.name + '->' + message.replace(/\n/g, '\\n'));
				}
				this.socket.write(message);
			}
			catch(e) {
				//console.log(e);
			}
		}
	},
	
	end: function() {
		if(!this.ended) {
			try {
				this.socket.end('Bye\n');
				this.remove();
			}
			catch(e) {
				//console.log(e);
			}
		}
	},
	
	remove: function() {
		this.ended = true;
		if(this.nextData) {
			this.nextData(false);
		}
		if(this.player) {
			this.log(':' + this.game.gamenum + ':' + this.player.name + '--disconnected');
			if(this.turn) {
				this.turn.end(true);
			}
			this.game.handlers.erase(this);
			this.player = null;
		}
	}
});