// include libraries
var requestDeployment = require('./requestDeployment'),
	editDeployment = require('./editDeployment'),
	viewDeployment = require('./viewDeployment'),
	deleteDeployment = require('./deleteDeployment'),
	updateDeployment = require('./updateDeployment'),
	deleteDatabase = require('./deleteDatabase'),
	addUser = require('./addUser');

var _utils = require('../utils'),
	getAllDeployments = _utils.getAllDeployments;

// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

exports.ini = function() {
	return ini;
};

// main landing page
exports.index = function(req, res) {

	//query
	var query = {
		sort: '+name'
	};

	//get query params
	if (req.query.q != '') {
		query['q'] = req.query.q;
	}
	if (req.query.status != '') {
		query['status'] = req.query.status;
	}
	if (req.query.limit != '') {
		query['limit'] = req.query.limit;
	}
	if (req.query.offset != '') {
		query['offset'] = req.query.offset;
	}
	if(req.query.sort !=''){
		query['sort'] = req.query.sort;
	}

	getAllDeployments(req, res, query, function(deployments) {
		res.render('deployments', {
			module: 'deployments',
			query: query,
			data: deployments,
			account: req.session.user,
			server: ini.information
		});
	});
};

exports.requestDeployment = requestDeployment;
exports.editDeployment = editDeployment;
exports.viewDeployment = viewDeployment;
exports.deleteDeployment = deleteDeployment;
exports.updateDeployment = updateDeployment;
exports.addUser = addUser;
exports.deleteDatabase = deleteDatabase;
