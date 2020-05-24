// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');

var deployments = require('./index');

module.exports = function viewDeployment(req, res) {
	if (req.params.did) {
		superagent
			.get(common.getAPIUrl(req) + 'api/v1/deployments/' + req.params.did)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				var user = response.body;
				if (error) {
					req.flash('errors', {
						msg: {
							text: 'there-is-error'
						}
					});
					return res.redirect('/deployments');
				} else if (response.statusCode == 200) {
					// send to deployments page
					res.render('addEditDeployment', {
						module: 'deployments',
						deployment: response.body,
						mode: "view",
						tab: 'deployment',
						account: req.session.user,
						server: deployments.ini().information
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+user.code
						}
					});
					return res.redirect('/deployments');
				} 
			});
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/deployments');
	}
};
