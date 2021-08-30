// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index');

module.exports = function login(req, res) {
	if (req.session.partial === false) {
		return res.redirect('/');
	} else if (req.method == 'POST') {
		// validate
		req.assert('tokenentry', {text: 'token-invalid'}).notEmpty();

		// get errors
		var errors = req.validationErrors();

		//to-do post request logic.

	} else {
		// send to verifyTOTP page
		res.render('verify2FA', {
			module: 'verify2FA',
			server: auth.ini().information
		});
	}
};
