//include libraries
var helm = require('./controller/helm'),
	users = require('./controller/users'),
	auth = require('./controller/auth'),
	deployments = require('./controller/deployments'),
	validate = require('./middleware/validateRequest'),
	common = require('../helper/common');

// Define roles
// eslint-disable-next-line no-unused-vars
var Admin="admin", Client="client", Moderator="moderator";

module.exports = function(app, ini, db) {

	//Only the requests that start with /api/v1/* will be checked for the token.
	app.all('/api/v1/*', [validate]);

	// Init modules
	helm.init(ini);
	users.init(ini, db);
	auth.init(ini);
	deployments.init(ini,db);

	// Routes that can be accessed by any one
	app.get('/api', common.getAPIInfo);
	app.post('/auth/login', auth.login);
	app.post('/auth/signup', auth.checkAdminOrLocal, auth.signup);
	app.get('/auth/verify/:sid', users.verifyUser);
	// Register helm API
	app.get('/api/v1/helm/list', auth.allowedRoles([Admin, Moderator]), helm.listReleases);

	// Register users API
	app.get("/api/v1/users", auth.allowedRoles([Admin, Moderator]), users.findAll);
	app.get("/api/v1/users/:uid", auth.allowedRoles([Admin, Moderator], true), users.findById);
	app.post("/api/v1/users", auth.allowedRoles([Admin]), users.addUser);
	// app.get("/api/v1/users/enable2FA/:uid", auth.allowedRoles([Admin, Moderator]), users.enable2FA);
	app.put("/api/v1/users/:uid", auth.allowedRoles([Admin], true), users.updateUser);
	app.delete("/api/v1/users/:uid", auth.allowedRoles([Admin]), users.removeUser);

	// Register deployments API
	app.get("/api/v1/deployments", auth.allowedRoles([Admin, Client, Moderator]), deployments.findAll);
	app.get("/api/v1/deployments/health", auth.allowedRoles([Admin, Moderator]), deployments.runHealthCheck);
	app.get("/api/v1/deployments/:did", auth.allowedRoles([Admin, Client, Moderator], true), deployments.findById);
	app.post("/api/v1/deployments", auth.allowedRoles([Admin, Client, Moderator]), deployments.addDeployment);
	app.put("/api/v1/deployments/status/:did", auth.allowedRoles([Admin]), deployments.updateStatus);
	app.put("/api/v1/deployments/deploy/:did", auth.allowedRoles([Admin]), deployments.deployDeployment);
	app.put("/api/v1/deployments/adduser/:did", auth.allowedRoles([Admin, Client, Moderator]), deployments.addUser);
	app.put("/api/v1/deployments/:did", auth.allowedRoles([Admin, Client, Moderator]), deployments.updateDeployment);
	app.delete("/api/v1/deployments/:did", auth.allowedRoles([Admin, Client, Moderator]), deployments.removeDeployment);

	//delete database API
	app.delete("/api/v1/deployments/dropdb/:did", auth.allowedRoles([Admin, Client, Moderator]), deployments.deleteDB);

	// If no route is matched by now, it must be a 404
	app.use('/api/v1/*', function(req, res) {
		return res.status(404).json({
			'status': 404,
			'error': "Route Not Found!",
			'code': 6,
			'url': req.protocol + '://' + req.get('host') + req.originalUrl
		});
	});
};
