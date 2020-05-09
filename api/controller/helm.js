//include libraries
var Helm = require("node-helm").Helm,
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
	let options = {};
	var releases = helm.listAsync(options);
	releases.then(function(rawData) {
		res.send({
			releases: JSON.parse(rawData)
		});
	}).catch(function(err) {
		console.log("Can not list releases", err);
	});	
};
