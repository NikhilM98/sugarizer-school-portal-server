var jwt = require('jwt-simple');
var auth = require('../controller/auth');
var config = require('../../config/secret.js')();

module.exports = function (partialAccess) {
		
	return function(req, res, next) {

		var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
		var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key']; //key is unique _id of the user
		
		if (token && key) {
		
			try {
				var decoded = jwt.decode(token, config);
		
				if (decoded.exp <= Date.now()) {
					return res.status(400).send({
						'error': "Token Expired",
						'code': 3
					});
				}

				if (partialAccess == false && decoded.partial == true) {
					return res.status(401).send({
						'error': "Unauthorized request, user not fully verified",
						'code': 36
					});
				}
				// Authorize the user to see if s/he can access our resources
				// The key would be the logged in user's id
				auth.validateUser(key, function(user) {
					if (user) {
		
						//store the user object in req
						req.user = user;
						//update user timestamp
						auth.updateTimestamp(key, function(err) {
							if (err) {
								return res.status(500).send({
									'error': 'An error has occurred while updating timestamp',
									'code': 11
								});
							}
							//send to the next middleware
							next();
						});	
					} else {
						// No user with this name exists, respond back with a 401
						return res.status(401).send({
							'error': "Invalid User",
							'code': 4
						});
					}
				});

			} catch (err) {
				return res.status(500).send({
					'error': err,
					'code': 5
				});
			}
		} else {
			return res.status(401).send({
				'error': "Invalid Token or Key",
				'code': 5
			});
		}
	};
};
