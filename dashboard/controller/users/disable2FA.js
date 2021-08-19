var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function disable2FA(req, res) {
	if (req.session.user.user._id) {
		if (req.method == 'POST') {
			superagent
				.put(common.getAPIUrl(req) + 'api/v1/users/disable2FA/' + req.session.user.user._id)
				.set(common.getHeaders(req))
				.send({
					state: false,
				})
				.end(function (error, response) {
					if (response.statusCode == 200) {
						req.flash('success', {
							msg: {
								text: 'totp-dsiabled',
							}
						});
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
					}
				});
			return res.redirect('/profile');
		} else {
			return res.redirect('/profile');
		}
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/');
	}
};
