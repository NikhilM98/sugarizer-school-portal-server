// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');


exports.getAllDeployments = function(req, res, query, callback) {
	superagent
		.get(common.getAPIUrl(req) + 'api/v1/deployments')
		.set(common.getHeaders(req))
		.query(query)
		.end(function (error, response) {
			if (response.statusCode == 200) {
				callback(response.body);
			} else {
				req.flash('errors', {
					msg: {
						text: 'error-code-'+response.body.code
					}
				});
				return res.redirect('/');
			}
		});
};
