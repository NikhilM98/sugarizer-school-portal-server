// require files
var dashboardController = require('./controller/dashboard');


module.exports = function(app, ini) {

	// init routes using settings
	dashboardController.init(ini);

	app.get('/', dashboardController.index);
	app.get('/test', dashboardController.index);

    // If no route is matched by now, it must be a 404
	app.get('/*', function(req, res) {
		res.render('404', {
			"message": "Route Not Found!",
			"url": req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
