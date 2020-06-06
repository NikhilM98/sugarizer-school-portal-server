// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

module.exports = function editDeployment(req, res) {
	if (req.params.did) {
		if (req.method == 'POST') {
			// validate

			req.body['sugarizer-username'] = req.body['sugarizer-username'] ? req.body['sugarizer-username'].trim() : '';
			req.assert('sugarizer-username', {text: 'username-invalid'}).matches(regexValidate('sugarizer-username'));

			req.body['sugarizer-password'] = req.body['sugarizer-password'] ? req.body['sugarizer-password'].trim() : '';
			req.assert('sugarizer-password', {text: 'password-invalid'}).matches(regexValidate('sugarizer-password'));

			// get errors
			var errors = req.validationErrors();

			if (!errors) {
				var user = {
					username: req.body['sugarizer-username'],
					password: req.body['sugarizer-password']
				};
				superagent
					.put(common.getAPIUrl(req) + 'api/v1/deployments/adduser/' + req.params.did)
					.set(common.getHeaders(req))
					.send({
						user: JSON.stringify(user)
					})
					.end(function (error, response) {
						if (response.statusCode == 200) {
							req.flash('success', {
								msg: {
									text: 'deployment-updated',
									params: {
										name: req.body.name
									}
								}
							});
							return res.redirect('/deployments/edit/' + req.params.did + '#settings');
						} else {
							req.flash('errors', {
								msg: {
									text: 'error-code-'+response.body.code
								}
							});
							return res.redirect('/deployments/edit/' + req.params.did + '#settings');
						}
					});
			} else {
				req.flash('errors', errors);
				return res.redirect('/deployments/edit/' + req.params.did + '#settings');
			}
		} else {
			return res.redirect('/deployments/edit/' + req.params.did + '#settings');
		}
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/deployments');
	}
};
