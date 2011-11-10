require('./mootools.js');
var cn = require('./connection.js');
var event = require('events');

exports.Client = new Class({
	initialize: function(handler) {
		this.handler = handler;
		handler.client = this;
		handler.init();
	},
	
	connect: function(host) {
		this.host = host;
		this.connection = new cn.Connection(host);
		this.connection.on('connect', this.connected.bind(this));
		this.connection.on('line', this.line.bind(this));
		this.connection.on('error', this.error.bind(this));
		this.connection.on('end', this.end.bind(this));
	},
	
	start: function(cb) {
		this.message('start');
	},
	
	done: function(cb) {
		this.message('done');
	},
	
	play: function(card) {
		this.message('play ' + card);
	},
	
	buy: function(card) {
		this.message('buy ' + card);
	},
	
	canbuy: function() {
		this.message('show canbuy');
	},
	
	message: function(message) {
		if(this.connected) {
			this.connection.message(message + '\n');
		}
	},
	
	connected: function() {
		this.connected = true;
		this.handler.connected();
	},
	
	handlers: [
		{
			match: function(l) {
				return l == '';
			},
			handle: function() {
				this.handler.emptyLine();
			}
		},
		{
			match: function(l) {
				return l == 'what is your name?';
			},
			handle: function() {
				this.handler.getName(this.message.bind(this));
			}
		},
		{
			match: function(l) {
				return l == 'that is not a valid name';
			},
			handle: function() {
				this.handler.getName(this.message.bind(this), true);
			}
		},
		{
			match: function(l) {
				return l.indexOf('welcome') === 0;
			},
			handle: function() {
				this.handler.welcome();
			}
		},
		{
			match: function(l) {
				return l == 'Bye';
			},
			handle: function() {
				
			}
		},
		{
			match: function(l) {
				return l == 'the game has started';
			},
			handle: function() {
				this.handler.startGame();
			}
		},
		{
			match: function(l) {
				return l.indexOf('bank:') === 0;
			},
			handle: function(l) {
				var cs = l.substring(6).split(',');
				var cards = {};
				cs.each(function(part) {
					var ps = part.split(' ');
					cards[ps[0]] = parseInt(ps[1]);
				});
				this.handler.bank(cards);
			}
		},
		{
			match: function(l) {
				return l.indexOf('you drew a') === 0;
			},
			handle: function(l) {
				this.handler.drew(l.substr(l.lastIndexOf(' ') + 1));
			}
		},
		{
			match: function(l) {
				return l.indexOf('you gained a') === 0;
			},
			handle: function(l) {
				this.handler.gain(l.substr(l.lastIndexOf(' ') + 1));
			}
		},
		{
			match: function(l) {
				return l == 'you shuffled your cards';
			},
			handle: function(l) {
				this.handler.shuffled();
			}
		},
		{
			match: function(l) {
				return l == 'it\'s your turn';
			},
			handle: function(l) {
				this.handler.startTurn();
			}
		},
		{
			match: function(l) {
				return l.indexOf('hand:') === 0;
			},
			handle: function(l) {
				this.handler.hand(l.substr(6).split(','));
			}
		},
		{
			match: function(l) {
				return l.indexOf('canbuy:') === 0;
			},
			handle: function(l) {
				this.handler.canbuy(l.substr(8).split(','));
			}
		},
		{
			match: function(l) {
				return l == 'you can\'t afford anything';
			},
			handle: function(l) {
				this.handler.canbuy(false);
			}
		},
		{
			match: function(l) {
				return l.indexOf('actions:') === 0;
			},
			handle: function(l) {
				this.handler.actions(parseInt(l.substr(9)));
			}
		},
		{
			match: function(l) {
				return l.indexOf('the winner is') === 0;
			},
			handle: function(l) {
				this.handler.winner(l.substr(l.lastIndexOf(' ') + 1));
			}
		},
		{
			match: function(l) {
				return l.indexOf('buys:') === 0;
			},
			handle: function(l) {
				this.handler.buys(parseInt(l.substr(6)));
			}
		},
		{
			match: function(l) {
				return l.indexOf('cash:') === 0;
			},
			handle: function(l) {
				this.handler.cash(parseInt(l.substr(6)));
			}
		},
		{
			match: function(l) {
				return l == 'your turn has finished';
			},
			handle: function(l) {
				this.handler.finishTurn();
			}
		}
	],
	
	line: function(l) {
		if(this.handlers.some(function(handler) {
			if(handler.match(l)) {
				handler.handle.call(this, l);
				return true;
			}
		}, this)) {
			this.handler.handled(l);
		}
		else {
			this.handler.unhandled(l);
		}
	},
	
	error: function(e) {
		this.connected = false;
		this.handler.finish(e);
	},
	
	end: function() {
		this.connected = false;
		this.handler.finish();
	}
});

exports.ClientHandler = new Class({
	Extends: event.EventEmitter,
	
	init: function() {
		
	},
	
	connected: function() {
		
	},
	
	getName: function(cb, invalid) {
		
	},
	
	welcome: function() {
		
	},
	
	startGame: function() {
		
	},
	
	bank: function(cards) {
		
	},
	
	drew: function(card) {
		
	},
	
	shuffled: function() {
		
	},
	
	startTurn: function() {
		
	},
	
	hand: function(cards) {
		
	},
	
	actions: function(actions) {
		
	},
	
	buys: function(buys) {
		
	},
	
	cash: function(cash) {
		
	},
	
	gain: function(card) {
		
	},
	
	emptyLine: function() {
		
	},
	
	finishTurn: function() {
		
	},
	
	finish: function(e) {
		
	},
	
	winner: function(name) {
		
	},
	
	handled: function(l) {
		
	},
	
	unhandled: function(l) {
		
	}
});