// include libraries
var superagent = require('superagent'),
	moment = require('moment'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

var users = require('./index');

module.exports = function editUser(req, res) {

	if (req.params.uid) {
		if (req.method == 'POST') {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/users/' + req.params.uid)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: 'ThereIsError'
						});
						return res.redirect('/users');
					} else if (response.statusCode == 200) {

						// validate
						delete req.body.role;
						if (response.body.role == 'client') {
							delete req.body.username;
							req.body.email = req.body.email.trim();
							req.assert('email', 'EmailInvalid').matches(regexValidate('email'));
						} else {
							delete req.body.email;
							req.body.username = req.body.username.trim();
							req.assert('username', 'UsernameInvalid').matches(regexValidate('username'));
						}

						req.body.name = req.body.name.trim();
						req.assert('name', 'NameInvalid').matches(regexValidate('name'));

						req.body.password = req.body.password ? req.body.password.trim() : '';
						if (req.body.password) {
							req.assert('password', 'PasswordAtLeast' + users.ini().security.min_password_size).len(users.ini().security.min_password_size);
							req.assert('password', 'PasswordInvalid').matches(regexValidate('pass'));
						} else {
							delete req.body.password;
						}

						// get errors
						var errors = req.validationErrors();

						if (!errors) {
							superagent
								.put(common.getAPIUrl(req) + 'api/v1/users/' + req.params.uid)
								.set(common.getHeaders(req))
								.send({
									user: JSON.stringify(req.body)
								})
								.end(function (error, response) {
									console.log(response);
									if (response.statusCode == 200) {
										req.flash('success', {
											msg: 'UserUpdated' + ' Name: ' + req.body.name
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
										return res.redirect('/users/edit/' + req.params.uid);
									}	
								});
						} else {
							req.flash('errors', errors);
							return res.redirect('/users/edit/' + req.params.uid);
						}
					} else {
						req.flash('errors', {
							msg: 'ErrorCode'+user.code
						});
						return res.redirect('/users');
					} 
				});
		} else {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/users/' + req.params.uid)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: 'ThereIsError'
						});
						return res.redirect('/users');
					} else if (response.statusCode == 200) {
						// send to users page
						res.render('addEditUser', {
							module: 'users',
							user: user,
							mode: "edit",
							moment: moment,
							account: req.session.user,
							server: users.ini().information
						});
					} else {
						req.flash('errors', {
							msg: 'ErrorCode'+user.code
						});
						return res.redirect('/users');
					} 
				});
		}
	} else {
		req.flash('errors', {
			msg: 'ThereIsError'
		});
		return res.redirect('/users');
	}
};
