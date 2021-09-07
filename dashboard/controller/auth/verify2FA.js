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
				.set(common.getHeaders(req))
				.send({
					userToken: otpToken
				})
				.end(function (error, response) {
					
					req.session.user = response.body.token;
					if (response.statusCode == 200) {

						if (response.body.fullAuth) { //verifiedUser is true - user fully authenticated.
							/**
							 The user is fully authenticated
							 so we redirect the user to dashboard
							 */
							return res.redirect('/');
						} else {
							/**
							 The user has enabled 2FA, and is not fully authenticated
							 so we redirect the user to verify2FA page and show the error.
							 */
							req.flash('errors', {
								msg: {
									text: 'wrong-totp'
								}
							});
							return res.redirect('/verify2FA');
						}
					}
				});
		} else {
			req.flash('errors', errors);
			return res.redirect('/verify2FA');
		}
	} else {
		res.render('verify2FA', {
			module: 'verify2FA',
			server: auth.ini().information,
			account: req.session.user
		});
	}
};
