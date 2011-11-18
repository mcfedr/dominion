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
*    along with dominion-server.  If not, see <http://www.gnu.org/licenses/>.
*/

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

Array.prototype.removeOne = function(val) {
	var i = this.indexOf(val);
	if(i != -1) {
		this.splice(i, 1);
		return true;
	}
	return false;
};