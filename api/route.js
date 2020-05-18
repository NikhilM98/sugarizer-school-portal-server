//include libraries
var helm = require('./controller/helm'),
	users = require('./controller/users'),
	auth = require('./controller/auth'),
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

	// Routes that can be accessed by any one
	app.get('/api', common.getAPIInfo);
	app.post('/auth/login', auth.login);
	app.post('/auth/signup', auth.checkAdminOrLocal, auth.signup);

	// Register helm API
	app.get('/api/v1/helm/list', auth.allowedRoles([Admin, Moderator]), helm.listReleases);

	// Register users API
	app.get("/api/v1/users", auth.allowedRoles([Admin, Moderator]), users.findAll);
	app.get("/api/v1/users/:uid", auth.allowedRoles([Admin, Moderator], true), users.findById);
	app.post("/api/v1/users", auth.allowedRoles([Admin]), users.addUser);
	app.put("/api/v1/users/:uid", auth.allowedRoles([Admin], true), users.updateUser);
	app.delete("/api/v1/users/:uid", auth.allowedRoles([Admin]), users.removeUser);

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
