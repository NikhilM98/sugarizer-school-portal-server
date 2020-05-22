// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index'),
	regexValidate = require('../../../helper/regexValidate');

module.exports = function signup(req, res) {
	if (req.session.user) {
		// send to dashboard
		return res.redirect('/');
	} else if (req.method == 'POST') {
		// validate

		req.body.role = 'client'; // restrict user to client
		delete req.body.username; // delete username if present

		req.body.email = req.body.email ? req.body.email.trim() : '';
		req.assert('email', {text: 'email-invalid'}).matches(regexValidate('email'));

		req.body.name = req.body.name ? req.body.name.trim() : '';
		req.assert('name', {text: 'name-invalid'}).matches(regexValidate('name'));

		req.body.password = req.body.password ? req.body.password.trim() : '';
		req.assert('password', {
			text: 'password-at-least',
			params: {
				count: auth.ini().security.min_password_size
			}
		}).len(auth.ini().security.min_password_size);
		req.assert('password', {text: 'password-invalid'}).matches(regexValidate('pass'));

		req.body.language = req.body.language ? req.body.language.trim() : '';
		req.assert('language', {text: 'language-invalid'}).matches(regexValidate('language'));

		req.body.deployments = []; // empty list of deployments

		// get errors
		var errors = req.validationErrors();

		if (!errors) {
			superagent
				.post(common.getAPIUrl(req) + 'auth/signup')
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
						return res.redirect('/');
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.render('signup', {
							module: 'signup',
							user: {
								name:req.body.name,
								language:req.body.language,
								email:req.body.email
							},
							server: auth.ini().information
						});
					}
				});
		} else {
			req.flash('errors', errors);
			return res.redirect('/signup');
		}
	} else {
		// send to signup page
		res.render('signup', {
			module: 'signup',
			server: auth.ini().information
		});
	}
};
