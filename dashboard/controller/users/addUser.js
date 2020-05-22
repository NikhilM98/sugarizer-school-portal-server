// include libraries
var superagent = require('superagent'),
	moment = require('moment'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

var users = require('./index');

module.exports = function addUser(req, res) {

	if (req.method == 'POST') {
		// validate

		req.body.role = req.body.role.trim();
		if (req.body.role == 'client') {
			delete req.body.username;
			req.body.email = req.body.email ? req.body.email.trim() : '';
			req.assert('email', {text: 'email-invalid'}).matches(regexValidate('email'));
		} else {
			delete req.body.email;
			req.body.username = req.body.username ? req.body.username.trim() : '';
			req.assert('username', {text: 'username-invalid'}).matches(regexValidate('username'));
		}

		req.body.name = req.body.name ? req.body.name.trim() : '';
		req.assert('name', {text: 'name-invalid'}).matches(regexValidate('name'));

		req.body.password = req.body.password ? req.body.password.trim() : '';
		req.assert('password', {
			text: 'password-at-least',
			params: {
				count: users.ini().security.min_password_size
			}
		}).len(users.ini().security.min_password_size);
		req.assert('password', {text: 'password-invalid'}).matches(regexValidate('pass'));

		req.body.language = req.body.language ? req.body.language.trim() : '';
		req.assert('language', {text: 'language-invalid'}).matches(regexValidate('language'));

		req.body.deployments = []; // empty list of deployments

		// get errors
		var errors = req.validationErrors();

		if (!errors) {
			superagent
				.post(common.getAPIUrl(req) + 'api/v1/users')
				.set(common.getHeaders(req))
				.send({
					user: JSON.stringify(req.body)
				})
				.end(function (error, response) {
					if (response.statusCode == 200) {
						req.flash('success', {
							msg: {
								text: 'user-created',
								params: {
									name: req.body.name
								}
							}
						});
						if (response.body.role == "admin") {
							// send to admin page
							return res.redirect('/users/?role=admin');
						} else if (response.body.role == "moderator") {
							// send to moderator page
							return res.redirect('/users/?role=moderator');
						} else {
							// send to users page
							return res.redirect('/users/');
						}
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.render('addEditUser', {
							module: 'users',
							user: {
								name:req.body.name,
								role:req.body.role,
								language:req.body.language,
								username:req.body.username,
								email:req.body.email
							},
							mode: "add",
							moment: moment,
							account: req.session.user,
							server: users.ini().information
						});
					}
				});
		} else {

			req.flash('errors', errors);

			return res.render('addEditUser', {
				module: 'users',
				user: {
					name:req.body.name,
					role:req.body.role,
					language:req.body.language,
					username:req.body.username,
					email:req.body.email
				},
				mode: "add",
				moment: moment,
				account: req.session.user,
				server: users.ini().information
			});
		}

	} else {
		res.render('addEditUser', {
			module: 'users',
			mode: "add",
			moment: moment,
			account: req.session.user,
			server: users.ini().information
		});
	}
};
