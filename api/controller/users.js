// User handling

var mongo = require('mongodb');

var db;

var usersCollection;

// Init database
exports.init = function(settings, database) {
	usersCollection = settings.collections.users;
	db = database;
};

exports.findById = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 18
		});
		return;
	}
	db.collection(usersCollection, function(err, collection) {
		collection.findOne({
			'_id': new mongo.ObjectID(req.params.uid)
		}, function(err, item) {
			res.send(item);
		});
	});
};

exports.findAll = function(req, res) {

	//prepare condition
	var query = {};
	query = addQuery('name', req.query, query);
	query = addQuery('language', req.query, query);
	query = addQuery('role', req.query, query, 'all');
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

	console.log("getAllUsers", query);

	//get data
	db.collection(usersCollection, function(err, collection) {
		var conf = [
			{
				$match: query
			},
			{
				$project: {
					name: 1,
					language: 1,
					role: 1,
					password: 1,
					options: 1,
					created_time: 1,
					timestamp: 1,
					insensitive: { "$toLower": "$name" }
				}
			},
			{ 
				$sort: {
					"insensitive": 1
				}
			}
		];

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
				console.log("usersList", usersList);
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
			query['name'] = {
				$regex: new RegExp(params[filter], "i")
			};
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
			'code': 21
		});
		return;
	}

	//parse user details
	var user = JSON.parse(req.body.user);

	//add timestamp & language
	user.created_time = +new Date();
	user.timestamp = +new Date();
	user.role = (user.role ? user.role.toLowerCase() : 'moderator'); // ToDo: change this in future

	if ((req.user && req.user.role=="moderator") && (user.role=="admin" || user.role=="moderator")) {
		res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 19
		});
		return;
	}

	//validation for fields [password, name]
	if (!user.password || !user.name) {
		res.status(401).send({
			'error': "Invalid user object!",
			'code': 2
		});
		return;
	}

	//check if user already exist
	exports.getAllUsers({
		'name': new RegExp("^" + user.name + "$", "i")
	}, {}, function(item) {
		if (item.length == 0) {
			db.collection(usersCollection, function(err, collection) {
				collection.insertOne(user, {
					safe: true
				}, function(err, result) {
					if (err) {
						res.status(500).send({
							'error': 'An error has occurred',
							'code': 10
						});
					} else {
						res.send(result.ops[0]);
					}
				});
			});

		} else {
			res.status(401).send({
				'error': 'User with same name already exist',
				'code': 22
			});
		}
	});
};

exports.updateUser = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 18
		});
		return;
	}

	//validate
	if (!req.body.user) {
		res.status(401).send({
			'error': 'User object not defined!',
			'code': 21
		});
		return;
	}

	var uid = req.params.uid;
	var user = JSON.parse(req.body.user);
	delete user.role; // Disable role change

	//do not update name if already exist
	if (typeof user.name !== 'undefined') {
		//check for unique user name validation
		exports.getAllUsers({
			'_id': {
				$ne: new mongo.ObjectID(uid)
			},
			'name': new RegExp("^" + user.name + "$", "i")
		}, {}, function(item) {
			if (item.length == 0) {

				//update user
				updateUser(uid, user, res);
			} else {
				res.status(401).send({
					'error': 'User with same name already exist',
					'code': 22
				});
			}
		});
	} else {
		//update user
		updateUser(uid, user, res);
	}
};

//private function to update user
function updateUser(uid, user, res) {
	db.collection(usersCollection, function(err, collection) {
		collection.findOneAndUpdate({ // ToDo: Test this function
			'_id': new mongo.ObjectID(uid)
		}, {
			$set: user
		}, {
			safe: true,
			returnNewDocument: true
		}, function(err, result) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 10
				});
			} else {
				if (result && result.ok && result.value) {
					res.send(result.value);
				} else {
					res.status(401).send({
						'error': 'Inexisting user id',
						'code': 23
					});
				}
			}
		});
	});
}

exports.removeUser = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.uid)) {
		res.status(401).send({
			'error': 'Invalid user id',
			'code': 18
		});
		return;
	}

	//delete user from db
	var uid = req.params.uid;
	db.collection(usersCollection, function(err, collection) {
		collection.findOneAndDelete({
			'_id': new mongo.ObjectID(uid)
		}, function(err, user) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 10
				});
			} else {
				if (user && user.ok && user.value) {
					res.send({
						'user_id': uid
					});
				} else {
					res.status(401).send({
						'error': 'Inexisting user id',
						'code': 23
					});
				}
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
