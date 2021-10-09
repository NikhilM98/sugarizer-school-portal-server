// User handling

var mongo = require('mongodb'),
	nodemailer = require('nodemailer'),
	translationUtil = require('./utils/translationUtil'),
	auth = require('./auth.js'),
	otplib = require('otplib');

var db;

var usersCollection;
var verification;
var smtp_port, smtp_host, smtp_tls_secure, smtp_user, smtp_pass, smtp_email;
var hostName;
var serviceName;
var verificationObject = {};

// Init database
exports.init = function(settings, database) {
	usersCollection = settings.collections.users;
	verification = settings.security.verification;
	if (verification) {
		smtp_port = settings.security.smtp_port;
		smtp_host = settings.security.smtp_host;
		smtp_tls_secure = settings.security.smtp_tls_secure;
		smtp_user = settings.security.smtp_user;
		smtp_pass = settings.security.smtp_pass;
		smtp_email = settings.security.smtp_email;
	}
	hostName = settings.system.hostName;
	serviceName = settings.security.service_name;
	db = database;
};

exports.findById = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}
	db.collection(usersCollection, function(err, collection) {
		collection.findOne({
			_id: new mongo.ObjectID(req.params.uid),
			verified: {
				$ne: false
			}
		}, function(err, item) {
			res.send(item);
		});
	});
};

// function to generate OTP Token for QR code.
function generateOTPToken (username, serviceName, secret){
	return otplib.authenticator.keyuri(
		username,
		serviceName,
		secret
	);
}

exports.updateSecret = function(req, res){
	if (!mongo.ObjectID.isValid(req.user._id)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}

	var uid = req.user._id;

	// Save unique secret in database.
	db.collection(usersCollection, function(err, collection) {
		collection.findOne({
			_id: new mongo.ObjectID(uid),
		}, function(err, user) {
			// only update database with unique secret if tfa is false or not defined -- for existing users in databse.
			if (user.tfa === false || typeof user.tfa === undefined) {
				var uniqueSecret = otplib.authenticator.generateSecret();
				db.collection(usersCollection, function(err, collection) {
					collection.findOneAndUpdate({
						'_id': new mongo.ObjectID(uid)
					}, {
						$set:
						{
							uniqueSecret: uniqueSecret
						}
					}, {
						safe: true,
						returnOriginal: false
					}, function(err, result) {
						if (err) {
							res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else if (result) {
							var updatedUser = result.value;
							var name = updatedUser.name;
							var manualKey = updatedUser.uniqueSecret;
							var otpAuth = generateOTPToken(name, serviceName, manualKey);

							delete updatedUser.password;
							//send user, manualKey and otpAuth for QRCode async function.
							res.send({
								user: user,
								uniqueSecret: manualKey,
								otpAuth: otpAuth
							});
						} else {
							res.status(401).send({
								'error': 'Inexisting user id',
								'code': 8
							});
						}
					});
				});
			} else if (user.tfa === true) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			}
		});
	});

};

exports.verifyTOTP = function(req, res) {
	//validate
	if (!mongo.ObjectID.isValid(req.user._id)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}

	var uid = req.user._id;

	if (!req.body.userToken) {
		res.status(401).send({
			'error': 'User Token not defined',
			'code': 31
		});
		return;
	}

	var uniqueToken = req.body.userToken;

	db.collection(usersCollection, function(err, collection) {
		collection.findOne({
			_id: new mongo.ObjectID(uid),
		}, function(err, user) {
			var uniqueSecret = user.uniqueSecret;
			if (!err) {
				try {
					var isValid = otplib.authenticator.check(uniqueToken, uniqueSecret);
				} catch (err) {
					res.status(401).send({
						'error': 'Could not verify OTP error in otplib',
						'code': 32
					});
				}
				if(isValid === true) {
					db.collection(usersCollection, function(err, collection) {
						collection.findOneAndUpdate({
							'_id': new mongo.ObjectID(uid)
						}, {
							$set:
							{
								tfa: isValid
							}
						}, {
							safe: true,
							returnOriginal: false
						}, function(err, result) {
							if (err) {
								res.status(500).send({
									'error': 'An error has occurred',
									'code': 7
								});
							} else {
								if (result && result.ok && result.value) {
									var user = result.value;
									delete user.password;
									delete user.uniqueSecret;
									res.send(user);
								} else {
									res.status(401).send({
										'error': 'Inexisting user id',
										'code': 8
									});
								}
							}
						});
					});
				} else {
					res.status(401).send({
						'error': 'Wrong TOTP!!',
						'code': 33
					});
					return;
				}
			} else {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			}
		});
	});

};

exports.disable2FA = function(req, res) {
	//validate
	if (!mongo.ObjectID.isValid(req.user._id)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}

	var uid = req.user._id;

	//disable TOTP
	db.collection(usersCollection, function(err, collection) {
		collection.findOneAndUpdate({
			'_id': new mongo.ObjectID(uid)
		}, {
			$set:
				{
					tfa: false,
					uniqueSecret: null
				}
		}, {
			safe: true,
			returnOriginal: false
		}, function(err, result) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else {
				if (result && result.ok && result.value) {
					var user = result.value;
					delete user.password;
					delete user.uniqueSecret;
					res.send(user);
				} else {
					res.status(401).send({
						'error': 'Inexisting user id',
						'code': 8
					});
				}
			}
		});
	});
};

exports.findAll = function(req, res) {

	//prepare condition
	var query = {
		verified: {
			$ne: false
		}
	};
	query = addQuery('name', req.query, query);
	query = addQuery('username', req.query, query);
	query = addQuery('email', req.query, query);
	query = addQuery('language', req.query, query);
	query = addQuery('role', req.query, query, 'client'); // set default value to clients
	query = addQuery('q', req.query, query);
	if (req.query.stime) {
		query['timestamp'] = {
			'$gte': parseInt(req.query.stime)
		};
	}

	// add filter and pagination
	db.collection(usersCollection, function(err, collection) {

		//count data
		collection.countDocuments(query, function(err, count) {

			//define var
			var params = JSON.parse(JSON.stringify(req.query));
			var route = req.route.path;
			var options = getOptions(req, count, "+name");
			//get data
			exports.getAllUsers(query, options, function(users) {

				//add pagination
				var data = {
					'users': users,
					'offset': options.skip,
					'limit': options.limit,
					'total': options.total,
					'sort': (options.sort[0][0] + '(' + options.sort[0][1] + ')'),
					'links': {
						'prev_page': ((options.skip - options.limit) >= 0) ? formPaginatedUrl(route, params, (options.skip - options.limit), options.limit) : undefined,
						'next_page': ((options.skip + options.limit) < options.total) ? formPaginatedUrl(route, params, (options.skip + options.limit), options.limit) : undefined,
					},
				};

				// Return
				res.send(data);
			});
		});
	});
};

//form query params
function formPaginatedUrl(route, params, offset, limit) {
	//set params
	params.offset = offset;
	params.limit = limit;
	var str = [];
	for (var p in params)
		if (p && Object.prototype.hasOwnProperty.call(params, p)) {
			str.push((p) + "=" + (params[p]));
		}
	return '?' + str.join("&");
}

//get all users
exports.getAllUsers = function(query, options, callback) {

	//get data
	db.collection(usersCollection, function(err, collection) {
		var conf = [
			{
				$match: query
			},
			{
				$project: {
					name: 1,
					username: 1,
					email: 1,
					language: 1,
					role: 1,
					deployments: 1,
					created_time: 1,
					timestamp: 1,
					tfa: 1,
					insensitive: { "$toLower": "$name" },
					verified: 1
				}
			},
			{ 
				$sort: {
					"insensitive": 1
				}
			}
		];

		if (options.enablePassword == true) {
			conf[1]["$project"]["password"] = 1;
		}

		if (options.enableSecret == true) {
			conf[1]["$project"]["uniqueSecret"] = 1;
		}

		if (typeof options.sort == 'object' && options.sort.length > 0 && options.sort[0] && options.sort[0].length >= 2) {
			conf[1]["$project"]["insensitive"] = { "$toLower": "$" + options.sort[0][0] };

			if (options.sort[0][1] == 'desc') {
				conf[2]["$sort"] = {
					"insensitive": -1
				};
			} else {
				conf[2]["$sort"] = {
					"insensitive": 1
				};
			}
		}

		collection.aggregate(conf, function (err, users) {
			if (options.skip) users.skip(options.skip);
			if (options.limit) users.limit(options.limit);
			//return
			users.toArray(function(err, usersList) {
				callback(usersList);
			});
		});
	});
};

function getOptions(req, count, def_sort) {

	//prepare options
	var sort_val = (typeof req.query.sort === "string" ? req.query.sort : def_sort);
	var sort_type = sort_val.indexOf("-") == 0 ? 'desc' : 'asc';
	var options = {
		sort: [
			[sort_val.substring(1), sort_type]
		],
		skip: req.query.offset || 0,
		total: count,
		limit: req.query.limit || 10
	};

	//cast to int
	options.skip = parseInt(options.skip);
	options.limit = parseInt(options.limit);

	//return
	return options;
}

//private function for filtering and sorting
function addQuery(filter, params, query, default_val) {

	//check default case
	query = query || {};

	if (filter == "undefined") return query;

	//validate
	if (typeof params[filter] != "undefined" && typeof params[filter] === "string") {

		if (filter == 'q') {
			
			query['$or'] = [
				{
					name: {
						$regex: new RegExp(params[filter], "i")
					}
				}, {
					email: {
						$regex: new RegExp(params[filter], "i")
					}
				}, {
					username: {
						$regex: new RegExp(params[filter], "i")
					}
				}
			];
		} else if (filter == 'role') {
			if (params[filter] != 'all') {
				query[filter] = {
					$regex: new RegExp("^" + params[filter] + "$", "i")
				};
			} 
		} else {
			query[filter] = {
				$regex: new RegExp("^" + params[filter] + "$", "i")
			};
		}
	} else {
		//default case
		if (typeof default_val != "undefined") {
			query[filter] = default_val;
		}
	}

	//return
	return query;
}

exports.addUser = function(req, res) {

	//validate
	if (!req.body.user) {
		res.status(401).send({
			'error': 'User object not defined!',
			'code': 2
		});
		return;
	}

	//parse user details
	var user = JSON.parse(req.body.user);

	//add timestamp & language
	user.created_time = +new Date();
	user.timestamp = +new Date();
	user.role = (user.role ? user.role.toLowerCase() : 'client');
	// api test condition
	if (!user.tfa) {
		user.tfa = false;
	}

	// Validation for client
	if (verification && user.role == 'client') {
		if (req.route.path == "/auth/signup") {
			user.verified = false;
		} else if (req.route.path != "/api/v1/users") {
			res.status(401).send({
				'error': 'Unauthorized source URL',
				'code': "27"
			});
			return;
		} else {
			user.verified = true;
		}
	} else {
		user.verified = true;
	}

	if ((req.user && req.user.role=="moderator") && (user.role=="admin" || user.role=="moderator")) {
		res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 9
		});
		return;
	}

	//validation for fields [password, name]
	if (!user.password || !user.name || ((user.role=="client" && !user.email) || (user.role!="client" && !user.username))) {
		res.status(401).send({
			'error': "Invalid user object!",
			'code': 1
		});
		return;
	}

	var query = {
		verified: {
			$ne: false
		}
	};
	if (user.role=="client") {
		query['email'] = new RegExp("^" + user.email + "$", "i");
	} else {
		query['username'] = new RegExp("^" + user.username + "$", "i");
	}

	//check if user already exist
	exports.getAllUsers(query, {}, function(item) {
		if (item.length == 0) {
			auth.hashPassword(user, function (err, user) {
				if (err) {
					return res.status(401).send({
						'error': err.message,
						'code': 1
					});
				}

				db.collection(usersCollection, function(err, collection) {
					collection.insertOne(user, {
						safe: true
					}, function(err, result) {
						if (err) {
							res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else {
							var user = result.ops[0];
							delete user.password;
							delete user.uniqueSecret;
							if (user.verified === false) {
								var sid = "";
								var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
								for (var i = 0; i < 32; i++)
									sid += possible.charAt(Math.floor(Math.random() * possible.length));

								verificationObject[sid] = {
									_id: user._id,
									email: user.email,
									name: user.name
								};

								console.log(sid, {
									_id: user._id,
									email: user.email,
									name: user.name
								});

								var transMail = translationUtil.generateMail(user.language, user.name, hostName, sid);

								var mailOptions = {
									from: `${transMail.sspName} <${smtp_email}>`,
									to: user.email,
									html: transMail.mailHtml,
									subject: transMail.subject
								};

								var smtpTransporter = nodemailer.createTransport({
									port: smtp_port,
									host: smtp_host,
									secure: smtp_tls_secure,
									auth: {
										user: smtp_user,
										pass: smtp_pass,
									},
									debug: true
								});
								smtpTransporter.sendMail(mailOptions, function (error, info) {
									if (error) {
										console.log(error);
									} else {
										console.log('Message sent: ' + info.response);
									}
								});
								res.send(user);
							} else {
								res.send(user);
							}
						}
					});
				});
			});
		} else {
			res.status(401).send({
				'error': 'User with same email/username already exist',
				'code': 10
			});
		}
	});
};

exports.updateUser = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}

	//validate
	if (!req.body.user) {
		res.status(401).send({
			'error': 'User object not defined!',
			'code': 2
		});
		return;
	}

	var uid = req.params.uid;
	var user = JSON.parse(req.body.user);
	delete user.role; // Disable role change

	if (req.user && req.user.role=="client") {
		delete user.email;
	}

	exports.getAllUsers({
		'_id': new mongo.ObjectID(uid)
	}, {}, function(users) {
		if (users.length > 0) {
			var query = {
				_id: {
					$ne: new mongo.ObjectID(uid)
				},
				verified: {
					$ne: false
				}
			};
			var role = users[0].role;
			if (role=="client") {
				query['email'] = new RegExp("^" + user.email + "$", "i");
			} else {
				query['username'] = new RegExp("^" + user.username + "$", "i");
			}

			//do not update if email/username already exist
			if ((role=="client" && typeof user.email !== 'undefined') || (role!="client" && typeof user.username !== 'undefined')) {
				//check for unique email/username validation
				exports.getAllUsers(query, {}, function(item) {
					if (item.length == 0) {

						//update user
						updateUser(uid, user, res);
					} else {
						res.status(401).send({
							'error': 'User with same email/username already exist',
							'code': 10
						});
					}
				});
			} else {
				//update user
				updateUser(uid, user, res);
			}
		} else {
			res.status(401).send({
				'error': 'Invalid user id',
				'code': 8
			});
			return;
		}
	});
};


//private function to update user
function updateUser(uid, user, res) {
	auth.hashPassword(user, function (err, user) {
		if (err) {
			return res.status(401).send({
				'error': err.message,
				'code': 1
			});
		}

		db.collection(usersCollection, function(err, collection) {
			collection.findOneAndUpdate({
				'_id': new mongo.ObjectID(uid)
			}, {
				$set: user
			}, {
				safe: true,
				returnOriginal: false
			}, function(err, result) {
				if (err) {
					res.status(500).send({
						'error': 'An error has occurred',
						'code': 7
					});
				} else {
					if (result && result.ok && result.value) {
						var user = result.value;
						delete user.password;
						delete user.uniqueSecret;
						res.send(user);
					} else {
						res.status(401).send({
							'error': 'Inexisting user id',
							'code': 8
						});
					}
				}
			});
		});
	});
}

exports.removeUser = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	}

	//delete user from db
	var uid = req.params.uid;
	db.collection(usersCollection, function(err, collection) {
		collection.findOne({
			'_id': new mongo.ObjectID(uid)
		}, function(err, user) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else if (user) {
				if (typeof user.deployments == "object" && user.deployments > 0) {
					res.status(500).send({
						'error': 'User contains deployments',
						'code': 14
					});
				} else {
					collection.deleteOne({
						'_id': new mongo.ObjectID(uid)
					}, function(err) {
						if (err) {
							res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else {
							res.send({
								'user_id': uid
							});
						}
					});
				}
			} else {
				res.status(401).send({
					'error': 'Inexisting user id',
					'code': 8
				});
			}
		});
	});
};

//update user's time stamp
exports.updateUserTimestamp = function(uid, callback) {

	db.collection(usersCollection, function(err, collection) {
		collection.updateOne({
			'_id': new mongo.ObjectID(uid)
		}, {
			$set: {
				timestamp: +new Date()
			}
		}, {
			safe: true
		}, function(err) {
			callback(err);
		});
	});
};

exports.verifyUser = function(req, res) {
	if (!req.params.sid || req.params.sid.length != 32) {
		res.status(401).send({
			'error': 'Invalid secret id',
			'code': 28
		});
		return;
	}

	var sid = req.params.sid;

	var user = verificationObject[sid];

	if (!user || !user._id || !user.email) {
		res.status(401).send({
			'error': 'Secret not found',
			'code': 28
		});
		return;
	} else if (!mongo.ObjectID.isValid(user._id)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 8
		});
		return;
	} else {
		var query = {
			_id: {
				$ne: new mongo.ObjectID(user._id)
			},
			verified: {
				$ne: false
			},
			email: new RegExp("^" + user.email + "$", "i")
		};

		//check if user already exist
		exports.getAllUsers(query, {}, function(item) {
			if (item.length == 0) {
				db.collection(usersCollection, function(err, collection) {
					collection.findOneAndUpdate({
						'_id': new mongo.ObjectID(user._id)
					}, {
						$set: {
							verified: true
						}
					}, {
						safe: true,
						returnOriginal: false
					}, function(err, result) {
						if (err) {
							res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else {
							if (result && result.ok && result.value) {
								var user = result.value;
								delete user.password;
								delete user.uniqueSecret;
								delete verificationObject[sid];
								// Remove other unverified users with same email
								db.collection(usersCollection, function(err, collection) {
									collection.deleteMany({
										email: new RegExp("^" + user.email + "$", "i"),
										verified: false
									});
								});
								res.send(user);
							} else {
								res.status(401).send({
									'error': 'Inexisting user id',
									'code': 8
								});
							}
						}
					});
				});
			} else {
				res.status(401).send({
					'error': 'User with same email/username already exist',
					'code': 10
				});
			}
		});
	}
};
