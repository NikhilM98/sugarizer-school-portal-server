var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function deleteDatabase(req, res) {

	if (req.params.did) {
		superagent
			.get(common.getAPIUrl(req) + 'api/v1/deployments/' + req.params.did)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					req.flash('success', {
						text: 'delete-database-confirm',
						params: {
							name: response.body.name
						}
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+response.body.code
						}
					});
				}
				return res.redirect('/');
			});
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/deployments/edit/' + req.params.did + '#settings');
	}
};
