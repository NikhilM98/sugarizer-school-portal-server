var _utils = require('../utils'),
	getAllDeployments = _utils.getAllDeployments;

// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

// main landing page
exports.index = function(req, res) {
	getAllDeployments(req, res, {
		status: 'all',
		limit: 7,
		sort: '-timestamp'
	}, function(allRequests) {
		getAllDeployments(req, res, {
			status: 0,
			limit: 0
		}, function(pendingRequests) {
			getAllDeployments(req, res, {
				status: 1,
				limit: 0
			}, function(approvedRequests) {
				getAllDeployments(req, res, {
					status: 'deployed',
					limit: 7
				}, function(activeDeployments) {
					res.render('home', {
						module: 'home',
						allRequests: allRequests,
						pendingRequests: pendingRequests,
						approvedRequests: approvedRequests,
						activeDeployments: activeDeployments,
						server: ini.information,
						account: req.session.user
					});
				});
			});
		});
	});
};
