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
		.get(common.getAPIUrl() + 'api/v1/helm/list')
		.set(common.getHeaders(req))
		.end(function (error, response) {
			if (response.statusCode == 200) {
				res.render('releases', {
					module: 'releases',
					moment: moment,
					account: req.session.user,
					server: ini.information,
					releases: response.body.releases
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
