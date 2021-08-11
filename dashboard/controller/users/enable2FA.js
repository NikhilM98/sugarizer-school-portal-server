// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');
	// regexValidate = require('../../../helper/regexValidate');

var users = require('./index');

module.exports = function enable2FA(req, res) {

	if (req.session && req.session.user && req.session.user.user && req.session.user.user._id) {
		if (req.method == 'POST') {
			console.log("Post request, to be worked on after QR code");
			// superagent
			// 	.get(common.getAPIUrl(req) + 'api/v1/users/' + req.session.user.user._id)
			// 	.set(common.getHeaders(req))
			// 	.end(function (error, response) {
			// 		var user = response.body;
			// 		if (error) {
			// 			req.flash('errors', {
			// 				msg: {
			// 					text: 'there-is-error'
			// 				}
			// 			});
			// 			return res.redirect('/profile');
			// 		} else if (response.statusCode == 200) {
						
			// 			// validate
			// 			delete req.body.role;
			// 			if (response.body.role == 'client') {
			// 				delete req.body.username;
			// 				delete req.body.email;
			// 			} else {
			// 				delete req.body.email;
			// 				req.body.username = req.body.username.trim();
			// 				req.assert('username', {text: 'username-invalid'}).matches(regexValidate('username'));
			// 			}

			// 			req.body.name = req.body.name.trim();
			// 			req.assert('name', {text: 'name-invalid'}).matches(regexValidate('name'));

			// 			req.body.password = req.body.password ? req.body.password.trim() : '';
			// 			if (req.body.password) {
			// 				req.assert('password', {
			// 					text: 'password-at-least',
			// 					params: {
			// 						count: users.ini().security.min_password_size
			// 					}
			// 				}).len(users.ini().security.min_password_size);
			// 				req.assert('password', {text: 'password-invalid'}).matches(regexValidate('pass'));
			// 			} else {
			// 				delete req.body.password;
			// 			}

			// 			// get errors
			// 			var errors = req.validationErrors();

			// 			if (!errors) {
			// 				superagent
			// 					.put(common.getAPIUrl(req) + 'api/v1/users/' + req.session.user.user._id)
			// 					.set(common.getHeaders(req))
			// 					.send({
			// 						user: JSON.stringify(req.body)
			// 					})
			// 					.end(function (error, response) {
			// 						if (response.statusCode == 200) {
			// 							req.flash('success', {
			// 								msg: {
			// 									text: 'user-updated',
			// 									params: {
			// 										name: req.body.name
			// 									}
			// 								}
			// 							});
			// 						} else {
			// 							req.flash('errors', {
			// 								msg: {
			// 									text: 'error-code-'+response.body.code
			// 								}
			// 							});
			// 						}
			// 						return res.redirect('/profile');
			// 					});
			// 			} else {
			// 				req.flash('errors', errors);
			// 				return res.redirect('/profile');
			// 			}
			// 		} else {
			// 			req.flash('errors', {
			// 				msg: {
			// 					text: 'error-code-'+user.code
			// 				}
			// 			});
			// 			return res.redirect('/profile');
			// 		}
			// 	});
		} else {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/users/enable2FA/' + req.session.user.user._id)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: {
								text: 'there-is-error'
							}
						});
						console.log(error);
						return res.redirect('/profile');
					} else if (response.statusCode == 200) {
						// send to users page
						res.render('setup2FA', {
							user: user,
							account: req.session.user,
							server: users.ini().information
						});
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+user.code
							}
						});
						console.log(error);
						return res.redirect('/profile');
					}
				});
		}
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/');
	}
};
