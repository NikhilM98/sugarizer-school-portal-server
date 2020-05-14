// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function postLogin(req, res) {
	// validate
	req.assert('username', 'UsernameInvalid').notEmpty();
	req.assert('password', 'PasswordBlank').notEmpty();
	// req.assert('role', 'RoleInvalid').notEmpty();

	// get errors
	var errors = req.validationErrors();

	var role = req.body.role ? req.body.role : 'admin'; // ToDo: Remove this line later

	//form data
	var form = {
		user: JSON.stringify({
			name: req.body.username,
			password: req.body.password,
			role: role
		})
	};

	// language

	//call
	if (!errors) {
		// call
		superagent
			.post(common.getAPIUrl(req) + 'auth/login')
			.set({
				"content-type": "application/json",
			})
			.send(form)
			.end(function (error, response) {
				if (response.statusCode == 200) {
					//store user and key in session
					req.session.user = response.body;
	
					// redirect to dashboard
					return res.redirect('/');
				} else {
					req.flash('errors', {
						msg: 'ErrorCode'+response.body.code
					});
					return res.redirect('/login');
				}
			});
	} else {
		req.flash('errors', errors);
		return res.redirect('/login');
	}
};
