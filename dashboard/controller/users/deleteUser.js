// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function deleteUser(req, res) {

	if (req.params.uid) {
		var role = req.query.role;
		var name = req.query.name || 'user';
		if (req.params.uid == common.getHeaders(req)['x-key']) {
			req.flash('errors', {
				msg: {text: 'error-code-12'}
			});
			return res.redirect('/users/?role='+role);
		}
		superagent
			.delete(common.getAPIUrl(req) + 'api/v1/users/' + req.params.uid)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					// send to users page
					req.flash('success', {
						msg: {
							text: 'user-deleted',
							params: {
								name: name
							}
						}
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+response.body.code
						}
					});
				}
				if (role == "admin") {
					// send to admin page
					return res.redirect('/users/?role=admin');
				} else if (response.body.role == "moderator") {
					// send to moderator page
					return res.redirect('/users/?role=moderator');
				} else {
					// send to users page
					return res.redirect('/users/');
				}
			});
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/users');
	}
};
