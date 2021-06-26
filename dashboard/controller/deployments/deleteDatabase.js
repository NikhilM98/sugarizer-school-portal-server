var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function deleteDatabase(req, res) {
	if (req.params.did) {
		var school_short_name = req.query.name || 'deployment';
		superagent
			.delete(common.getAPIUrl(req) + 'api/v1/deployments/dropdb/' + req.params.did)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					req.flash('success', {
						msg: {
							text: 'database-deleted',
							params: {
								name: school_short_name
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
				return res.redirect('/deployments/');
			});
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/deployments/');
	}
};
