//include libraries
var helm = require('./controller/helm'),
	common = require('../helper/common');

module.exports = function(app, ini) {

	// Init modules
	helm.init(ini);

	// Routes that can be accessed by any one
	app.get('/api', common.getAPIInfo);

	app.get('/api/v1/helm/list', helm.listReleases);

	// If no route is matched by now, it must be a 404
	app.use('/api/v1/*', function(req, res) {
		return res.status(404).json({
			'status': 404,
			'error': "Route Not Found!",
			'code': 7,
			'url': req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
