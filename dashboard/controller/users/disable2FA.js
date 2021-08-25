var superagent = require('superagent'),
	common = require('../../../helper/common');


module.exports = function disable2FA(req, res) {
	if (req.method == 'POST') {
		superagent
			.put(common.getAPIUrl(req) + 'api/v1/profile/disable2FA')
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					req.flash('success', {
						msg: {
							text: 'totp-disabled',
						}
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+response.body.code
						}
					});
				}
				return res.redirect('/profile');
			});
	} else {
		return res.redirect('/profile');
	}
};
