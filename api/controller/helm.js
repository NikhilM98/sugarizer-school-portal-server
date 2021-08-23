//include libraries
var Helm = require("nodejs-helm").Helm,
	Promise = require("bluebird");

var helmBinary;
var helm;

// Init
exports.init = function(settings) {
	helmBinary = '/usr/local/bin/helm';

	if (process.platform == "win32") {
		helmBinary = 'helm';
	} else if (settings.system.helm_binary) {
		helmBinary = settings.system.helm_binary;
	}

	helm = Promise.promisifyAll(new Helm({helmCommand: helmBinary}));
};

exports.listReleases = function(req, res) {
	var options = {
		allNamespaces: true
	};
	helm.listAsync(options)
		.then(function(releases) {
			res.send({
				releases: releases
			});
		}).catch(function(err) {
			var error = 'An error has occurred';
			if (err.cause && err.cause.message) {
				error = err.cause.message;
			}
			res.status(500).send({
				'error': error,
				'code': 24
			});
		});
};
