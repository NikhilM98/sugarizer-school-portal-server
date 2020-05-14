var jwt = require('jwt-simple'),
	users = require('./users.js'),
	mongo = require('mongodb'),
	bcrypt = require('bcrypt'),
	common = require('../../helper/common');

var security;

// Init settings
exports.init = function(settings) {
	security = settings.security;
};

exports.login = function(req, res) {

	//parse response
	var user = JSON.parse(req.body.user);
	var name = user.name || '';
	var plainTextPassword = user.password || '';

	var query = {
		'name': {
			$regex: new RegExp("^" + name + "$", "i")
		}
	};

	//find user by name & password
	users.getAllUsers(query, {
		enablePassword: true
	}, function(users) {

		if (users && users.length > 0) {

			//take the first user incase of multple matches
			user = users[0];

			bcrypt.compare(plainTextPassword, user.password, function(err, result) {
				delete user.password; // remove user password from the response
				if (err) {
					return res.status(401).send({
						'error': err.message,
						'code': 1
					});
				} else if (result == false) {
					return res.status(401).send({
						'error': "Password do not match",
						'code': 1
					});
				}
				// If authentication is success, we will generate a token and dispatch it to the client
				var maxAge = security.max_age;
				res.send(genToken(user, maxAge));
			});
		} else {
			res.status(401).send({
				'error': "User not fount",
				'code': 1
			});
		}
		return;
	});

	exports.hashPassword(plainTextPassword, function (err, hash) {
		if (err) {
			return res.status(401).send({
				'error': err.message,
				'code': 1
			});
		}

		
	});
};

exports.signup = function(req, res) {

	//insert the user using the same logic but without auth
	users.addUser(req, res);
};

exports.validateUser = function(uid, callback) {

	//parse response
	users.getAllUsers({
		'_id': new mongo.ObjectID(uid)
	}, {}, function(users) {
		if (users.length > 0) {
			callback(users[0]);
		} else {
			callback(false);
		}
	});
};

//update user time stamp function
exports.updateTimestamp = function(uid, callback) {

	//update user time stamp function
	users.updateUserTimestamp(uid, callback);
};

//check role
exports.allowedRoles = function (roles) {
	return function (req, res, next) {
		if (roles.includes(req.user.role)) {
			return next();
		}
		res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 19
		});
	};
};

exports.checkAdminOrLocal = function(req, res, next) {
	var whishedRole = 'moderator';
	if (req.body && req.body.user) {
		var user = JSON.parse(req.body.user);
		whishedRole = user.role.toLowerCase();
	}
	var ip = common.getClientIP(req);
	var serverIp = common.getServerIP();
	if (whishedRole == 'admin' && serverIp.indexOf(ip) == -1) {
		return res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 19
		});
	}
	next();
};

exports.hashPassword = function(param, callback) {
	var plainTextPassword;
	if (typeof param == "string") plainTextPassword = param;
	else if (typeof param == "object") {
		if (param.password && typeof param.password == "string") {
			plainTextPassword = param.password;
		} else {
			callback(null, param);
		}
	}
	if (plainTextPassword) {
		bcrypt.hash(plainTextPassword, parseInt(security.salt_rounds), function(err, hash) {
			if (err) {
				callback(err);
			} else if (typeof param == "object") {
				param.password = hash;
				callback(null, param);
			} else {
				callback(null, hash);
			}
		});
	} else {
		callback({
			message: "Missing parameter - password"
		});
	}
};

// private method
function genToken(user, age) {
	var expires = expiresIn(age);
	var token = jwt.encode({
		exp: expires
	}, require('../../config/secret')());

	return {
		token: token,
		expires: expires,
		user: user
	};
}

function expiresIn(numMs) {
	var dateObj = new Date();
	return dateObj.setTime(dateObj.getTime() + parseInt(numMs));
}
