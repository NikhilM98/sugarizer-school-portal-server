// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function deleteDeployment(req, res) {
	if (req.params.did) {
		var name = req.query.name || 'deployment';
		superagent
			.delete(common.getAPIUrl(req) + 'api/v1/deployments/dropdb' + req.params.did)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					// send to users page
					req.flash('success', {
						msg: {
							text: 'deployment-deleted',
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
