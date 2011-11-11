require('./mootools.js');

String.prototype.possessive = function() {
	if(this.charAt(this.length - 1) != 's') {
		return this + '\'s';
	}
	return this + '\'';
};

Array.prototype.reduce = function(joinfunc, offset) {
	if(offset) {
		if(this.length > offset) {
			return joinfunc(this[offset], this.reduce(joinfunc, offset + 1));
		}
		else {
			return null;
		}
	}
	if(this.length == 0) {
		return null;
	}
	else if(this.length == 1) {
		return joinfunc(this[0]);
	}
	else if(this.length == 2) {
		return joinfunc(this[0], this[1]);
	}
	else {
		return joinfunc(this[0], this.reduce(joinfunc, 1));
	}
};

Array.prototype.reduce = function(joinfunc, t) {
	var x;
	this.each(function(v, k) {
		x = joinfunc(x, v, k);
	}, t);
	return x;
};

Object.prototype.reduce = function(obj, joinfunc, t) {
	var x;
	Object.each(obj, function(v, k) {
		x = joinfunc(x, v, k);
	}, t);
	return x;
};