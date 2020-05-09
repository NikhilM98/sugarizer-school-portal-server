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
