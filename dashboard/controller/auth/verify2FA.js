// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index');

module.exports = function login(req, res) {
	if (req.session.user.partial === false) {
		return res.redirect('/');
	} else if (req.method == 'POST') {
		// validate
		req.assert('tokenentry', {text: 'token-invalid'}).notEmpty();

		var otpToken = req.body.tokenentry;
		// get errors
		var errors = req.validationErrors();

		//to-do post request logic.
		if (!errors){
			superagent
				.put(common.getAPIUrl(req) + 'auth/verify2FA')
				.set({
					"content-type": "application/json",
				})
				.send({
					userToken: otpToken
				})
				.end(function (error, response) {
					if (response.statusCode == 200 && response.body.fullAuth) {
						// redirect to dashboard
						req.session.user = response.body.token;
						return res.redirect('/');
					} else {
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
		res.render('verify2FA', {
			module: 'verify2FA',
			server: auth.ini().information,
			account: req.session.user
		});
	}
};
