// require files
var authController = require('./controller/auth'),
	homeController = require('./controller/home'),
	usersController = require('./controller/users'),
	releasesController = require('./controller/releases'),
	deploymentsController = require('./controller/deployments'),
	healthController = require('./controller/health'),
	utilsController = require('./controller/utils');


module.exports = function(app, ini) {

	// init routes using settings
	authController.init(ini);
	homeController.init(ini);
	usersController.init(ini);
	releasesController.init(ini);
	deploymentsController.init(ini);
	healthController.init(ini);
	utilsController.init(ini);

	// Routes
	app.get('/login', authController.login);
	app.post('/login', authController.login);

	app.get('/signup', authController.signup);
	app.post('/signup', authController.signup);

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

	app.get('/deployments', authController.validateSession, deploymentsController.index);
	app.get('/deployments/request', authController.validateSession, deploymentsController.requestDeployment);
	app.post('/deployments/request', authController.validateSession, deploymentsController.requestDeployment);
	app.get('/deployments/edit/:did', authController.validateSession, deploymentsController.editDeployment);
	app.post('/deployments/edit/:did', authController.validateSession, deploymentsController.editDeployment);
	app.get('/deployments/view/:did', authController.validateSession, deploymentsController.viewDeployment);
	app.get('/deployments/delete/:did', authController.validateSession, deploymentsController.deleteDeployment);
	app.get('/deployments/update/:did', authController.validateSession, authController.checkRole(deploymentsController.updateDeployment));
	app.post('/deployments/adduser/:did', authController.validateSession, authController.checkRole(deploymentsController.addUser, null, deploymentsController.addUser));

	app.get('/health', authController.validateSession, authController.checkRole(healthController.index, healthController.index));

	// If no route is matched by now, it must be a 404
	app.get('/*', function(req, res) {
		res.render('404', {
			"message": "Route Not Found!",
			"url": req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
