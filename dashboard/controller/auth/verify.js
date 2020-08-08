// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index');

module.exports = function signup(req, res) {
	if (req.session.user || !req.params.sid) {
		// send to dashboard
		return res.redirect('/');
	} else {
		superagent
			.get(common.getAPIUrl(req) + 'auth/verify/' + req.params.sid)
			.end(function (error, response) {
				console.log(response.statusCode, response.body);
				if (response.statusCode == 200) {
					// send to signup page
					res.render('signup', {
						module: 'signup',
						mode: 'verification',
						user: response.body,
						server: auth.ini().information
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+response.body.code
						}
					});
					return res.redirect('/');
				} 
			});
	}
};
