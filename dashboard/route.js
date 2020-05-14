// require files
var authController = require('./controller/auth'),
	homeController = require('./controller/home'),
	releasesController = require('./controller/releases');


module.exports = function(app, ini) {

	// init routes using settings
	authController.init(ini);
	homeController.init(ini);
	releasesController.init(ini);

	// Routes
	app.get('/login', authController.getLogin);
	app.post('/login', authController.postLogin);
	app.get('/logout', authController.logout);
	app.get('/', authController.validateSession, homeController.index);
	app.get('/list', authController.validateSession, releasesController.index);

	// If no route is matched by now, it must be a 404
	app.get('/*', function(req, res) {
		res.render('404', {
			"message": "Route Not Found!",
			"url": req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
