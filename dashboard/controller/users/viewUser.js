// include libraries
var superagent = require('superagent'),
	moment = require('moment'),
	common = require('../../../helper/common');
var users = require('./index');

module.exports = function editUser(req, res) {
	if (req.params.uid) {
		superagent
			.get(common.getAPIUrl(req) + 'api/v1/users/' + req.params.uid)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				var user = response.body;
				console.log("error", error);
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
						mode: "view",
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
	} else {
		req.flash('errors', {
			msg: 'ThereIsError'
		});
		return res.redirect('/users');
	}
};
