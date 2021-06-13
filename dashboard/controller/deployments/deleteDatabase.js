var superagent = require('superagent'),
	common = require('../../../helper/common');

module.exports = function deleteDatabase(req, res) {
	if (req.params.did && req.query.dropdb) {
		superagent
			.get(common.getAPIUrl(req) + 'api/v1/deployments/dropdb' + req.params.did)
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (response.statusCode == 200) {
					req.flash('success', {
						text: 'delete-database-confirm',
						params: {
							name: response.body.name
						}
					});
				} else {
					req.flash("Error here in db.js file");
				}
				return res.redirect('/deployments/');
			});
	} else {
		req.flash("Error here in db.js file at the end");
		return res.redirect('/deployments/edit/' + req.params.did + '#settings');
	}
};
