// require files
var authController = require('./controller/auth'),
	homeController = require('./controller/home'),
	usersController = require('./controller/users'),
	releasesController = require('./controller/releases');


module.exports = function(app, ini) {

	// init routes using settings
	authController.init(ini);
	homeController.init(ini);
	usersController.init(ini);
	releasesController.init(ini);

	// Routes
	app.get('/login', authController.getLogin);
	app.post('/login', authController.postLogin);
	app.get('/logout', authController.logout);
	app.get('/', authController.validateSession, homeController.index);
	app.get('/releases', authController.validateSession, releasesController.index);

	app.get('/users', authController.validateSession, authController.checkRole(usersController.index, usersController.index));
	app.get('/users/add', authController.validateSession, authController.checkRole(usersController.addUser));
	app.post('/users/add', authController.validateSession, authController.checkRole(usersController.addUser));
	app.get('/users/edit/:uid', authController.validateSession, authController.checkRole(usersController.editUser, usersController.editUser));
	app.post('/users/edit/:uid', authController.validateSession, authController.checkRole(usersController.editUser));
	app.get('/users/view/:uid', authController.validateSession, authController.checkRole(usersController.viewUser, usersController.viewUser));
	app.get('/users/delete/:uid', authController.validateSession, authController.checkRole(usersController.deleteUser));

	app.get('/profile', authController.validateSession, usersController.profile);
	app.post('/profile', authController.validateSession, usersController.profile);

	// If no route is matched by now, it must be a 404
	app.get('/*', function(req, res) {
		res.render('404', {
			"message": "Route Not Found!",
			"url": req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
