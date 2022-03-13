var fs = require('fs');
var os = require('os');
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

exports.getHeaders = function(req) {

	// headers
	return {
		"content-type": "application/json",
		"x-access-token": (req.session.user ? req.session.user.token : ""),
		"x-key": (req.session.user ? req.session.user.user._id : ""),
	};
};

exports.getClientIP = function(req) {

	return req.headers['x-real-ip'] ||
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
};


exports.getServerIP = function() {

	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (var i in interfaces) {
		for (var j in interfaces[i]) {
			var address = interfaces[i][j];
			if (address.family === 'IPv6' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}
	addresses.push("::1");
	addresses.push("::ffff:127.0.0.1");
	return addresses;
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
			"cookie-age": ini.security.max_age,
			"consent-need": ini.privacy.consent_need,
			"policy-url": ini.privacy.policy
		}
	});
};
