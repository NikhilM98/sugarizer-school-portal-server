// User handling

var mongo = require('mongodb');

var db;

var usersCollection;
var deploymentsCollection;

// Init database
exports.init = function(settings, database) {
	usersCollection = settings.collections.users;
	deploymentsCollection = settings.collections.deployments;
	db = database;
};

exports.findById = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
		});
		return;
	}

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOne({
			'_id': new mongo.ObjectID(req.params.did)
		}, function(err, item) {
			res.send(item);
		});
	});
};

exports.findAll = function(req, res) {

	//prepare condition
	var query = {};
	query = addQuery('name', req.query, query);
	query = addQuery('school_short_name', req.query, query);
	query = addQuery('status', req.query, query);
	query = addQuery('q', req.query, query);

	if (req.query.stime) {
		query['timestamp'] = {
			'$gte': parseInt(req.query.stime)
		};
	}

	if (req.user && req.user.role=="client") {
		query = addQuery('user_id', req.query, query, req.user._id);
	}

	// add filter and pagination
	db.collection(deploymentsCollection, function(err, collection) {

		//count data
		collection.countDocuments(query, function(err, count) {

			//define var
			var params = JSON.parse(JSON.stringify(req.query));
			var route = req.route.path;
			var options = getOptions(req, count, "+name");
			//get data
			exports.getAllDeployments(query, options, function(deployments) {

				//add pagination
				var data = {
					'deployments': deployments,
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

//get all deployments
exports.getAllDeployments = function(query, options, callback) {

	console.log("getAllDeployments", query);

	//get data
	db.collection(deploymentsCollection, function(err, collection) {
		var conf = [
			{
				$match: query
			},
			{
				$project: {
					name: 1,
					user_id: 1,
					school_short_name: 1,
					school_address: 1,
					students_count: 1,
					classrooms_count: 1,
					student_grade: 1,
					teachers_count: 1,
					device_count: 1,
					device_info: 1,
					status: 1,
					deployed: 1,
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

		collection.aggregate(conf, function (err, deployments) {
			if (options.skip) deployments.skip(options.skip);
			if (options.limit) deployments.limit(options.limit);
			//return
			deployments.toArray(function(err, deploymentsList) {
				console.log("deploymentsList", deploymentsList);
				callback(deploymentsList);
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
		} else if (filter == 'user_id') {
			query['user_id'] = new mongo.ObjectID(default_val);
		} else if (filter == 'status') {
			if (params[filter] != 'all' && parseInt(params[filter]) != "NaN") {
				query[filter] = parseInt(params[filter]);
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

exports.addDeployment = function(req, res) {

	//validate
	if (!req.body.deployment) {
		res.status(401).send({
			'error': 'Deployment object not defined!',
			'code': 13
		});
		return;
	}

	//parse deployment details
	var deployment = JSON.parse(req.body.deployment);

	//add timestamp & language
	deployment.created_time = +new Date();
	deployment.timestamp = +new Date();
	deployment.status = (deployment.status && parseInt(deployment.status) ? parseInt(deployment.status) : 0);

	deployment.user_id = new mongo.ObjectID(req.user._id);

	deployment.deployed = false;

	if ((req.user && (req.user.role=="client" || req.user.role=="moderator")) && deployment.status != 0) {
		res.status(401).send({
			'error': 'You don\'t have permission to perform this action',
			'code': 9
		});
		return;
	}

	//validation for fields [password, name]
	if (!deployment.name || !deployment.school_short_name) {
		res.status(401).send({
			'error': "Invalid deployment object!",
			'code': 16
		});
		return;
	}

	deployment.school_short_name = deployment.school_short_name.toLowerCase();

	var query = {
		'school_short_name': new RegExp("^" + deployment.school_short_name + "$", "i")
	};

	//check if user already exist
	exports.getAllDeployments(query, {}, function(item) {
		if (item.length == 0) {
			db.collection(deploymentsCollection, function(err, collection) {
				collection.insertOne(deployment, {
					safe: true
				}, function(err, result) {
					if (err) {
						res.status(500).send({
							'error': 'An error has occurred',
							'code': 7
						});
					} else {
						db.collection(usersCollection, function(err, collection) {
							collection.updateOne({
								_id: new mongo.ObjectID(req.user._id)
							},
							{
								$push: {
									deployments: result.ops[0]._id // Push deployment ID
								}
							}, {
								safe: true
							},
							function(err, rest) {
								if (err) {
									return res.status(500).send({
										'error': 'An error has occurred',
										'code': 7
									});
								} else {
									if (rest && rest.result && rest.result.n == 1) {
										res.send(result.ops[0]);
									} else {
										return res.status(401).send({
											'error': 'Error while assigning deployment to user',
											'code': 17
										});
									}
								}
							});
						});
					}
				});
			});
		} else {
			res.status(401).send({
				'error': 'Deployment with same school-short-name already exist',
				'code': 18
			});
		}
	});
};

exports.updateDeployment = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
		});
		return;
	}

	//validate
	if (!req.body.deployment) {
		res.status(401).send({
			'error': 'Deployment object not defined!',
			'code': 13
		});
		return;
	}

	var did = req.params.did;
	var deployment = JSON.parse(req.body.deployment);
    
	deployment.timestamp = +new Date(); // Update timestamp
	delete deployment.school_short_name; // Disable school_short_name change
	delete deployment.deployed; // Disable deployed state change
	delete deployment.user_id; // Disable user_id change

	if (req.user && (req.user.role=="client" || req.user.role=="moderator")) {
		delete deployment.status;
	}

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOneAndUpdate({
			'_id': new mongo.ObjectID(did)
		}, {
			$set: deployment
		}, {
			safe: true,
			returnNewDocument: true
		}, function(err, result) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else {
				if (result && result.ok && result.value) {
					res.send(result.value);
				} else {
					res.status(401).send({
						'error': 'Inexisting deployment id',
						'code': 15
					});
				}
			}
		});
	});
};

exports.removeDeployment = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
		});
		return;
	}

	var did = new mongo.ObjectID(req.params.did);

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOne({
			'_id': new mongo.ObjectID(did)
		}, function(err, deployment) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else if (deployment) {
				if (deployment.deployed) {
					res.status(500).send({
						'error': 'Cannot remove active deployment',
						'code': 19
					});
				} else {
					collection.deleteOne(
						{
							_id: new mongo.ObjectID(did)
						},
						function(err, result) {
							if (err) {
								res.status(500).send({
									'error': "An error has occurred",
									'code': 7
								});
							} else {
								if (result && result.result && result.result.n == 1) {
									db.collection(usersCollection, function(err, collection) {
										collection.updateOne({
											_id: new mongo.ObjectID(deployment.user_id)
										}, {
											$pull: {
												deployments: new mongo.ObjectID(req.params.did)
											}
										}, {
											safe: true
										},
										function(err, result) {
											if (err) {
												return res.status(500).send({
													'error': 'An error has occurred',
													'code': 7
												});
											} else {
												if (result && result.result && result.result.n == 1) {
													res.send(deployment);
												} else {
													return res.status(401).send({
														'error': 'Error while removing deployment from user',
														'code': 17
													});
												}
											}
										});
									});
								} else {
									res.status(401).send({
										'error': 'Inexisting deployment id',
										'code': 15
									});
								}
							}
						}
					);
				}
			} else {
				res.status(401).send({
					'error': 'Inexisting deployment id',
					'code': 15
				});
			}
		});
	});
};

exports.updateStatus = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
		});
		return;
	}

	//validate
	if (typeof req.body.status != "number") {
		res.status(401).send({
			'error': 'Status not defined!',
			'code': 16
		});
		return;
	}

	var did = req.params.did;
	var deployment = {};
	deployment.status = req.body.status;
	deployment.timestamp = +new Date(); // Update timestamp

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOneAndUpdate({
			_id: new mongo.ObjectID(did),
			deployed: false
		}, {
			$set: deployment
		}, {
			safe: true,
			returnNewDocument: true
		}, function(err, result) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else {
				if (result && result.ok && result.value) {
					res.send(result.value);
				} else {
					res.status(401).send({
						'error': 'Inexisting deployment id',
						'code': 15
					});
				}
			}
		});
	});
};

exports.deployDeployment = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
		});
		return;
	}

	//validate
	if (typeof req.body.deployed != "boolean") {
		res.status(401).send({
			'error': 'Deploy not defined!',
			'code': 16
		});
		return;
	}

	var did = req.params.did;
	var updatedDeployment = {};
	updatedDeployment.deployed = req.body.deployed;
	updatedDeployment.timestamp = +new Date(); // Update timestamp

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOne({
			_id: new mongo.ObjectID(did),
			status: 1
		}, function(err, deployment) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else if (deployment) {
				if (deployment.deployed) {
					// disable deployment
					collection.updateOne({
						_id: new mongo.ObjectID(did),
						status: 1
					}, {
						$set: updatedDeployment
					}, {
						safe: true
					},
					function(err, result) {
						if (err) {
							return res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else {
							if (result && result.result && result.result.n == 1) {
								res.send(deployment);
							} else {
								return res.status(401).send({
									'error': 'Inexisting deployment id',
									'code': 15
								});
							}
						}
					});
				} else {
					// enable deployment
					collection.updateOne({
						_id: new mongo.ObjectID(did),
						status: 1
					}, {
						$set: updatedDeployment
					}, {
						safe: true
					},
					function(err, result) {
						if (err) {
							return res.status(500).send({
								'error': 'An error has occurred',
								'code': 7
							});
						} else {
							if (result && result.result && result.result.n == 1) {
								res.send(deployment);
							} else {
								return res.status(401).send({
									'error': 'Inexisting deployment id',
									'code': 15
								});
							}
						}
					});
				}
			} else {
				res.status(401).send({
					'error': 'Inexisting deployment id',
					'code': 15
				});
			}
		});
	});
};
