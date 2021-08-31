var jwt = require('jwt-simple'),
	users = require('./users.js'),
	mongo = require('mongodb'),
	bcrypt = require('bcrypt'),
	otplib = require('otplib'),
	common = require('../../helper/common');

var security;
var maxAge;
var maxAgeTfa;
// Init settings
exports.init = function(settings) {
	security = settings.security;
	maxAge = security.max_age;
	maxAgeTfa = security.max_age_TFA;
};

exports.login = function(req, res) {

	//parse response
	var user = JSON.parse(req.body.user);

	var query = {
		verified: {
			$ne: false
		}
	};
	if (user.email) {
		query['email'] = new RegExp("^" + user.email + "$", "i");
	} else if (user.username) {
		query['username'] = new RegExp("^" + user.username + "$", "i");
	} else {
		res.status(401).send({
			'error': "User not found",
			'code': 1
		});
		return;
	}

	var plainTextPassword = user.password || '';

	//find user by email/username & password
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
				if (user.tfa === false || typeof user.tfa === undefined) {
					res.send({
						token: genToken(user, maxAge, false),
						fullAuth: true
					});
				} else {
					res.send({
						token: genToken(user, maxAgeTfa, true), //give users a buffer of 30 mins to verify.
						fullAuth: false
					});
				}
			});
		} else {
			res.status(401).send({
				'error': "User not found",
				'code': 1
			});
		}
		return;
	});
};

exports.verify2FA = function(req, res) {

	if (!req.body.userToken) {
		return res.status(401).send({
			'error': 'User Token not defined',
			'code': 31
		});
	}

	//token that the user entered
	var uniqueToken = req.body.userToken;

	//fetch uid from session
	var uid = req.session.user.user._id;
	console.log(uid);
	// var uid = req.session.user.user._id;

	//find user by user id.
	users.getAllUsers({
		_id: new mongo.ObjectID(uid),
		verified: {
			$ne: false
		}
	}, {enableSecret: true}, function(users) {
		if (users && users.length > 0) {

			//take the first user incase of multple matches
			var user = users[0];
			console.log(user);
			var uniqueSecret = user.uniqueSecret;
			try {
				var isValid = otplib.authenticator.check(uniqueToken, uniqueSecret);
			} catch (err) {
				console.log(err.message);
				res.status(401).send({
					'error': 'Could not verify OTP error in otplib',
					'code': 32
				});
			}
			
			if (isValid === true) {
				// refresh the user token and set partial to false.
				res.send({
					token: genToken(user, maxAge, false)
				});
			} else {
				console.log("Wrong TOTP");
				res.status(401).send({
					'error': "Password do not match",
					'code': 1
				});
			}
		} else {
			res.status(401).send({
				'error': "User not found",
				'code': 1
			});
		}
		return;
	});
};

exports.signup = function(req, res) {

	//insert the user using the same logic but without auth
	users.addUser(req, res);
};

exports.validateUser = function(uid, callback) {

	//parse response
	users.getAllUsers({
		_id: new mongo.ObjectID(uid),
		verified: {
			$ne: false
		}
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
exports.allowedRoles = function (roles, secondaryAccess) {
	return function (req, res, next) {
		if (roles.includes(req.user.role)) {
			if (req.user.role == "client") {
				if (req.params.did) {
					if (req.user.deployments && includesID(req.user.deployments, req.params.did)) {
						return next();
					}
				} else {
					return next();
				}
			} else if (req.user.role == "moderator") {
				if (req.params.did && secondaryAccess) {
					return next();
				} else if (req.params.did) {
					if (req.user.deployments && includesID(req.user.deployments, req.params.did)) {
						return next();
					}
				} else {
					return next();
				}
			} else {
				return next();
			}
		} else if (secondaryAccess && req.params.uid) {
			if (req.user._id == req.params.uid) {
				return next();
			}
		}
		res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 9
		});
	};
};

function includesID(arr, id) {
	if (typeof arr == "object" && arr.length > 0) {
		for (var i=0; i<arr.length; i++) {
			if (arr[i].toString() == id) return true;
		}
	}
	return false;
}

exports.checkAdminOrLocal = function(req, res, next) {
	var whishedRole = 'client';
	if (req.body && req.body.user) {
		var user = JSON.parse(req.body.user);
		whishedRole = (user.role ? user.role.toLowerCase() : 'client');
	}
	var ip = common.getClientIP(req);
	var serverIp = common.getServerIP();
	if ((whishedRole == 'admin' || whishedRole == 'moderator') && serverIp.indexOf(ip) == -1) {
		return res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 9
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
			return;
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
function genToken(user, age, partial) {
	var expires = expiresIn(age);
	var token = jwt.encode({
		partial: partial, // set user todo for improvement in security.
		exp: expires
	}, require('../../config/secret')());

	return {
		token: token,
		expires: expires,
		user: user,
		partial: partial //partial authentication {False if 2FA disabled, True if 2FA enabled}
	};
}

function expiresIn(numMs) {
	var dateObj = new Date();
	return dateObj.setTime(dateObj.getTime() + parseInt(numMs));
}
