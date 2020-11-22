//include libraries
var Helm = require("nodejs-helm").Helm,
	Promise = require("bluebird"),
	nodemailer = require('nodemailer'),
	fs = require('fs'),
	mongo = require('mongodb'),
	validator = require('validator'),
	exec = require('child_process').exec;

var db;

var usersCollection, deploymentsCollection;

var kubectlBinary, helmBinary, chartName, replicaset, databaseUrl, hostName;
var helm;

var verification;
var smtp_port, smtp_host, smtp_tls_secure, smtp_user, smtp_pass, smtp_email;

// Init database
exports.init = function(settings, database) {
	usersCollection = settings.collections.users;
	deploymentsCollection = settings.collections.deployments;

	verification = settings.security.verification;
	if (verification) {
		smtp_port = settings.security.smtp_port;
		smtp_host = settings.security.smtp_host;
		smtp_tls_secure = settings.security.smtp_tls_secure;
		smtp_user = settings.security.smtp_user;
		smtp_pass = settings.security.smtp_pass;
		smtp_email = settings.security.smtp_email;
	}

	fs.access(settings.system.chart_path, fs.F_OK, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log("Chart found at " + settings.system.chart_path);
		chartName = settings.system.chart_path;
	});
	kubectlBinary = settings.system.kubectl_binary;
	replicaset = settings.system.replicaset;
	databaseUrl = settings.system.databaseUrl;
	hostName = settings.system.hostName;

	db = database;

	helmBinary = '/usr/local/bin/helm';
	if (process.platform == "win32") {
		helmBinary = 'helm';
	} else if (settings.system.helm_binary) {
		helmBinary = settings.system.helm_binary;
	}
	helm = Promise.promisifyAll(new Helm({helmCommand: helmBinary}));

	db.collection(deploymentsCollection, function(err, collection) {
		collection.updateMany({
			deployed: true
		}, {
			$set: {
				deployed: false
			}
		}, {
			safe: true
		}, function(err, result) {
			if (err || !(result && result.result && result.result.ok)) {
				console.log("Error: Error updating deployments");
			} else {
				helm.listAsync({
					allNamespaces: true
				}).then(function(releases) {
					var replicaExists = false;
					var releaseNames = releases.map(function(release) {
						if (release.name == databaseUrl) replicaExists = true;
						return release.name;
					});
					if (!replicaExists && replicaset) {
						console.log("Error: MongoDB replicaset not found on the cluster");
					}
					db.collection(deploymentsCollection, function(err, collection) {
						collection.updateMany({
							status: 1,
							school_short_name: {
								$in: releaseNames
							}
						}, {
							$set: {
								deployed: true
							}
						}, {
							safe: true
						}, function(err, result) {
							if (err || !(result && result.result && result.result.ok)) {
								console.log("Error: Error updating deployments");
							} else {
								console.log("Server Ready: Finished updating deployments");
							}
						});
					});
				}).catch(function(err) {
					var error = 'Error: Error fetching deployments';
					if (err.cause && err.cause.message) {
						error = err.cause.message;
					}
					console.log(error);
				});
			}
		});
	});
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
			item.deployment_description = validator.unescape(item.deployment_description);
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
			if (options.limit == 0) {
				res.send({
					'total': options.total
				});
			} else {
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
			}
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
					deployment_description: 1,
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
			query['$or'] = [
				{
					name: {
						$regex: new RegExp(params[filter], "i")
					}
				}, {
					school_short_name: {
						$regex: new RegExp(params[filter], "i")
					}
				}, {
					school_address: {
						$regex: new RegExp(params[filter], "i")
					}
				}
			];
		} else if (filter == 'user_id') {
			query['user_id'] = new mongo.ObjectID(default_val);
		} else if (filter == 'status') {
			if (params[filter] != 'all') {
				if (params[filter] == 'deployed') {
					query['deployed'] = true;
				} else if (parseInt(params[filter]) != "NaN") {
					query[filter] = parseInt(params[filter]);
				}
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
	} else if (req.user && req.user.role=="admin" && deployment.status != undefined && parseInt(deployment.status) != "NaN") {
		deployment.status = parseInt(deployment.status);
	}

	db.collection(deploymentsCollection, function(err, collection) {
		collection.findOneAndUpdate({
			'_id': new mongo.ObjectID(did)
		}, {
			$set: deployment
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
			returnOriginal: false
		}, function(err, result) {
			if (err) {
				res.status(500).send({
					'error': 'An error has occurred',
					'code': 7
				});
			} else {
				if (result && result.ok && result.value) {
					if (verification && result.value.user_id) {
						db.collection(usersCollection, function(err, collection) {
							collection.findOne({
								'_id': new mongo.ObjectID(result.value.user_id)
							}, function(err, user) {
								if (user.email) {
									var statusMsg;
									var statusTitle;
									if (result.value.status == 1) {
										statusMsg = "successfully approved";
										statusTitle = "Sugarizer School Portal - Deployment Approved";
									} else if (result.value.status == 2) {
										statusMsg = "rejected";
										statusTitle = "Sugarizer School Portal - Deployment Rejected";
									}
									if (statusMsg && statusTitle) {
										var mailOptions = {
											from: 'Sugarizer School Portal <' + smtp_email + '>',
											to: user.email,
											html: `<div style="text-align: left;color: #202124;font-size: 14px;line-height: 21px;font-family: sans-serif;">
											<div style="Margin-left: 20px;Margin-right: 20px;">
											  <div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
												<h2
												  style="Margin-top: 0;Margin-bottom: 16px;font-style: normal;font-weight: normal;color: #ab47bc;font-size: 26px;line-height: 34px;font-family: Avenir,sans-serif;text-align: center;">
												  <strong>Sugarizer School Portal</strong></h2>
											  </div>
											</div>
											<div style="Margin-left: 20px;Margin-right: 20px;">
											  <div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
												<p style="Margin-top: 0;Margin-bottom: 0;">Dear&nbsp;`
												+ user.name + `,</p>
												<p style="Margin-top: 20px;Margin-bottom: 0;">You deployment&nbsp;<i>`
												+ result.value.name + `</i>&nbsp;has been&nbsp;`
												+ statusMsg + `&nbsp;by&nbsp;<i>`
												+ req.user.name + `</i>.<br>Click <a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="`
												+ hostName + `" target="_blank">here</a> to login to Sugarizer School Portal.</p>
												<p style="Margin-top: 20px;Margin-bottom: 0;">Sincerely,<br>Sugarizer School Portal Team</p>
												<p class="size-8" style="mso-text-raise: 9px;Margin-top: 20px;Margin-bottom: 0;font-size: 8px;line-height: 14px;"
												  lang="x-size-8">This email was automatically sent by Sugarizer School Portal.</p>
											  </div>
											</div>
										  </div>`,
											subject: statusTitle
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
									}
								}
							});
						});
					}
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
				if (deployment.deployed && !req.body.deployed) {
					// disable deployment
					helm.uninstallAsync({
						releaseName: deployment.school_short_name.toLowerCase(),
						namespace: 'default'
					}).then(function () {
						collection.findOneAndUpdate({
							_id: new mongo.ObjectID(did),
							status: 1
						}, {
							$set: updatedDeployment
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
									res.send(result.value);
								} else {
									res.status(401).send({
										'error': 'Inexisting deployment id',
										'code': 15
									});
								}
							}
						});
					}).catch(function (err) {
						var error = 'Error uninstalling deployment';
						if (err.cause && err.cause.message) {
							error = err.cause.message;
						}
						return res.status(500).send({
							'error': error,
							'code': 21,
							'name': deployment.name,
							'school_short_name': deployment.school_short_name
						});
					});
				} else if (!deployment.deployed && req.body.deployed) {
					// enable deployment
					var values = {
						schoolShortName: deployment.school_short_name.toLowerCase(),
						hostName: deployment.school_short_name.toLowerCase() + '.' + hostName,
						replicaset: replicaset,
						databaseUrl: databaseUrl
					};
					helm.installAsync({
						chartName: chartName,
						releaseName: deployment.school_short_name.toLowerCase(),
						namespace: 'default',
						values: values
					}).then(function () {
						collection.findOneAndUpdate({
							_id: new mongo.ObjectID(did),
							status: 1
						}, {
							$set: updatedDeployment
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
									res.send(result.value);
								} else {
									res.status(401).send({
										'error': 'Inexisting deployment id',
										'code': 15
									});
								}
							}
						});
					}).catch(function (err) {
						var error = 'Error installing deployment';
						console.log("Error installing deployment", err);
						if (err.cause && err.cause.message) {
							error = err.cause.message;
						}
						return res.status(500).send({
							'error': error,
							'code': 20,
							'name': deployment.name,
							'school_short_name': deployment.school_short_name
						});
					});
				} else {
					res.send(deployment);
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

exports.addUser = function(req, res) {
	if (!mongo.ObjectID.isValid(req.params.did)) {
		res.status(401).send({
			'error': 'Invalid deployment id',
			'code': 15
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

	//parse user details
	var user = JSON.parse(req.body.user);

	//validation for fields [password, username]
	if (!user.password || !user.username) {
		res.status(401).send({
			'error': "Invalid user object!",
			'code': 1
		});
		return;
	}

	var did = req.params.did;
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
					// Get Pod-name
					var getPodName = `${kubectlBinary} get pod --all-namespaces -l school=${deployment.school_short_name} -o jsonpath="{.items[0].metadata.name}"`;
					executeCommand(getPodName, function(err, data) {
						if (err) {
							res.status(500).send({
								'error': 'Coult not find sugarizer pod',
								'code': 23
							});
						} else {
							var podName = data;
							// Add User
							var addUser = `${kubectlBinary} exec -it -n sugarizer-${deployment.school_short_name} ${podName} -- sh add-admin.sh ${user.username} ${user.password} http://127.0.0.1:8080/auth/signup`;
							executeCommand(addUser, function() {
								res.send(deployment);
							});
						}
					});
				} else {
					res.status(500).send({
						'error': 'Deployment is not active',
						'code': 22
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

exports.runHealthCheck = function(req, res) {
	var command = `${kubectlBinary} get pod --all-namespaces -l app=http -o json`;
	executeCommand(command, function(err, data) {
		if (err) {
			return res.status(500).send({
				'error': 'Unable to connect to the cluster',
				'code': 25
			});
		} else {
			if(data) {
				try {
					data = JSON.parse(data);
				} catch(e) {
					return res.status(500).send({
						'error': 'Unable to parse the data',
						'code': 26
					});
				}
			}
			var readyContainers = [];
			var waitingContainers = [];
			var containers = [];
			if (data && data.items) {
				for (var i=0; i<data.items.length; i++) {
					if ((data.items[i].metadata && data.items[i].metadata.labels && data.items[i].metadata.labels.school) && (data.items[i].status && data.items[i].status.containerStatuses && data.items[i].status.containerStatuses[0])) {
						if (data.items[i].status.containerStatuses[0].ready) {
							readyContainers.push(data.items[i].metadata.labels.school);
						} else {
							waitingContainers.push(data.items[i].metadata.labels.school);
						}
						containers.push({
							name: data.items[i].metadata.labels.school,
							podName: data.items[i].metadata.name,
							status: data.items[i].status.containerStatuses[0].ready,
							timestamp: data.items[i].metadata.creationTimestamp,
							namespace: data.items[i].metadata.namespace
						});
					}
				}
			}
			res.send({
				ready: readyContainers,
				waiting: waitingContainers,
				containers: containers
			});
		}
	});
};

function executeCommand(command, callback) {
	exec(command, (error, stdout, stderr) =>{
		if(error) {
			console.error('error: ' + error);
		}
		callback(stderr,stdout);
	});
}
