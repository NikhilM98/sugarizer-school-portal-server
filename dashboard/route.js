// require files
var homeController = require('./controller/home'),
	releasesController = require('./controller/releases');


module.exports = function(app, ini) {

	// init routes using settings
	homeController.init(ini);
	releasesController.init(ini);

	app.get('/', homeController.index);
	app.get('/list', releasesController.index);

	// If no route is matched by now, it must be a 404
	app.get('/*', function(req, res) {
		res.render('404', {
			"message": "Route Not Found!",
			"url": req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
