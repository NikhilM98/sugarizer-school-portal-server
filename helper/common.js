var fs = require('fs');
var ini = null;

exports.init = function(settings) {
	ini = settings;
	var info = JSON.parse(fs.readFileSync("./package.json", 'utf-8'));
	ini.version = info.version;
};

exports.loadCredentials = function(settings) {
	if (!settings.security.certificate_file || !settings.security.key_file) {
		return null;
	}
	var cert, key;
	try {
		cert = fs.readFileSync(settings.security.certificate_file);
		key = fs.readFileSync(settings.security.key_file);
		if (!settings.security.strict_ssl) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		}
	} catch(err) {
		return null;
	}
	return {cert: cert, key: key};
};

exports.getAPIUrl = function() {
	return (ini.security.https ? 'https' : 'http' ) + "://localhost:" + ini.web.port + '/';
};

exports.getAPIInfo = function(req, res) {
	res.send({
		"name": ini.information.name,
		"description": ini.information.description,
		"web": ini.web.port,
		"secure": ini.security.https,
		"version": ini.version,
		"options": {
			"min-password-size": ini.security.min_password_size,
			"cookie-age": ini.security.max_age
		}
	});
};
