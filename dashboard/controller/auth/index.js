// include libraries
var login = require('./login'),
	logout = require('./logout'),
	signup = require('./signup'),
	verify = require('./verify'),
	validateSession = require('./validateSession'),
	checkRole = require('./checkRole');

// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

exports.ini = function() {
	return ini;
};

exports.login = login;
exports.logout = logout;
exports.signup = signup;
exports.verify = verify;
exports.validateSession = validateSession;
exports.checkRole = checkRole;
