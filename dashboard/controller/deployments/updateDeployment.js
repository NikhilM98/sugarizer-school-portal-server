// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');

var _utils = require('../utils'),
	sendSlackNotification = _utils.sendSlackNotification;

module.exports = function updateDeployment(req, res) {
	if (req.params.did) {
		var mode = req.query.mode ? req.query.mode.trim() : '';
		if (mode) {
			if (mode == "reject" || mode == "approve") {
				var status;
				if (mode == "approve") status = 1;
				else status = 2;

				superagent
					.put(common.getAPIUrl(req) + 'api/v1/deployments/status/' + req.params.did)
					.set(common.getHeaders(req))
					.send({
						status: status
					})
					.end(function (error, response) {
						if (response.statusCode == 200) {
							// send to users page
							req.flash('success', {
								msg: {
									text: 'deployment-updated',
									params: {
										name: response.body.name
									}
								}
							});
						} else {
							req.flash('errors', {
								msg: {
									text: 'error-code-'+response.body.code
								}
							});
						}
						return res.redirect('/deployments/edit/' + req.params.did + '#settings');
					});
			} else if (mode == "stop" || mode == "deploy") {
				var deployed;
				if (mode == "deploy") deployed = true;
				else deployed = false;

				superagent
					.put(common.getAPIUrl(req) + 'api/v1/deployments/deploy/' + req.params.did)
					.set(common.getHeaders(req))
					.send({
						deployed: deployed
					})
					.end(function (error, response) {
						if (response.statusCode == 200) {
							// send to users page
							var message;
							if (deployed) {
								message = "Deployment *" + response.body.name + "* has been successfully deployed as `" + response.body.school_short_name + "` :tada:";
							} else {
								message = "Deployment *" + response.body.name + "* has been successfully removed which was present as `" + response.body.school_short_name + "` :wastebasket:";
							}
							sendSlackNotification({
								"text": message
							});
							req.flash('success', {
								msg: {
									text: 'deployment-updated',
									params: {
										name: response.body.name
									}
								}
							});
						} else {
							var message;
							if (deployed) {
								message = "Failed to deploy *" + response.body.name + "* deployment as `" + response.body.school_short_name + "` :warning:";
							} else {
								message = "Failed to remove *" + response.body.name + "* deployment which is present as `" + response.body.school_short_name + "` :bangbang:";
							}
							sendSlackNotification({
								"text": message
							});
							req.flash('errors', {
								msg: {
									text: 'error-code-'+response.body.code
								}
							});
						}
						return res.redirect('/deployments/edit/' + req.params.did + '#settings');
					});
			} else {
				req.flash('errors', {
					msg: {
						text: 'mode-not-defined'
					}
				});
				return res.redirect('/deployments/edit/' + req.params.did + '#settings');
			}
		} else {
			req.flash('errors', {
				msg: {
					text: 'mode-not-defined'
				}
			});
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
