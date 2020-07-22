// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common');


var slackWebUrl;

// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
	if (ini.webhooks && ini.webhooks.slack_webhook_url) {
		slackWebUrl = ini.webhooks.slack_webhook_url;
	}
};

exports.getAllDeployments = function(req, res, query, callback) {
	superagent
		.get(common.getAPIUrl(req) + 'api/v1/deployments')
		.set(common.getHeaders(req))
		.query(query)
		.end(function (error, response) {
			if (response.statusCode == 200) {
				callback(response.body);
			} else {
				req.flash('errors', {
					msg: {
						text: 'error-code-'+response.body.code
					}
				});
				return res.redirect('/');
			}
		});
};

exports.sendSlackNotification = function(message, callback) {
	if (slackWebUrl) {
		superagent
			.post(slackWebUrl)
			// .send(JSON.stringify(message))
			.send(message)
			.end(function (error, response) {
				if (response.statusCode == 200) {
					if (callback) callback(true);
				} else {
					if (callback) callback(false);
				}
			});
	} else {
		if (callback) callback(false);
	}
};
