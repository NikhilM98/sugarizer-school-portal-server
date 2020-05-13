// include libraries
var superagent = require('superagent'),
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
		.end(function (error, response) {
			if (response.statusCode == 200) {
				res.render('releases', {
					title: 'releases',
					module: 'releases',
					server: ini.information,
					releases: response.body.releases
				});
			} else {
				req.send({
					msg: "Could not get releases"
				});
			}	
		});
};
