// include libraries
var superagent = require('superagent'),
	moment = require('moment'),
	common = require('../../../helper/common');

// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

// main landing page
exports.index = function(req, res) {
	superagent
		.get(common.getAPIUrl(req) + 'api/v1/deployments/health')
		.set(common.getHeaders(req))
		.end(function (error, response) {
			if (response.statusCode == 200) {
				res.render('health', {
					module: 'health',
					moment: moment,
					account: req.session.user,
					server: ini.information,
					deploymentStatus: response.body
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
};
