// include libraries
var superagent = require('superagent'),
	moment = require('moment'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

var users = require('./index');

module.exports = function addUser(req, res) {

	if (req.method == 'POST') {

		// validate
		
		req.body.name = req.body.name.trim();
		req.body.password = req.body.password ? req.body.password.trim() : '';

		req.body.role = req.body.role.trim();

		if (req.body.role == 'client') {
			delete req.body.username;
			req.body.email = req.body.email.trim();
			req.assert('email', 'EmailInvalid').matches(regexValidate('email'));
		} else {
			delete req.body.email;
			req.body.username = req.body.username.trim();
			req.assert('username', 'UsernameInvalid').matches(regexValidate('username'));
		}

		req.assert('name', 'NameInvalid').matches(regexValidate('name'));
		req.assert('password', 'PasswordAtLeast' + users.ini().security.min_password_size).len(users.ini().security.min_password_size);
		req.assert('password', 'PasswordInvalid').matches(regexValidate('pass'));

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
							msg: 'UserCreated' + " Name : " + req.body.name
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
							msg: 'ErrorCode'+response.body.code
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
