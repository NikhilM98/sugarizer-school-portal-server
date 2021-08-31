// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index');

module.exports = function verify2FA(req, res) {
	if (req.method == 'POST') {
		// validate
		req.assert('tokenentry', {text: 'token-invalid'}).notEmpty();

		var otpToken = req.body.tokenentry;
		// get errors
		var errors = req.validationErrors();

		//to-do post request logic.
		if (!errors){
			superagent
				.post(common.getAPIUrl(req) + 'auth/verify2FA')
				.send({
					userToken: otpToken
				})
				.end(function (error, response) {
					if (response.statusCode == 200) {
						/*
						refresh the user token and store it in the session,
						then redirect to dashboard
						*/
						req.session.user = response.body.token;
						return res.redirect('/');
					} else {
						console.log(response);
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.redirect('/verify2FA');
					}
				});
		} else {
			req.flash('errors', errors);
			return res.redirect('/verify2FA');
		}
	} else {
		// send to verifyTOTP page
		// console.log(req.session.user);
		res.render('verify2FA', {
			module: 'verify2FA',
			server: auth.ini().information,
			account: req.session.user
		});
	}
};
