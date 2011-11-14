require('./mootools.js');

String.prototype.possessive = function() {
	if(this.charAt(this.length - 1) != 's') {
		return this + '\'s';
	}
	return this + '\'';
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