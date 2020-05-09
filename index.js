// require files
var express = require('express'),
	http = require('http'),
	https = require('https'),
	fs = require('fs'),
	process = require('process'),
	settings = require('./config/settings'),
	common = require('./helper/common'),
	ini = settings.load(),
	app = express(),
	server = null;

// Prevent uncaught exception
process.on("uncaughtException", function(err) {
	console.error("FATAL ERROR, uncaught exception '" + err.message + "'");
	console.error(err.stack);
	process.exit(-1);
});

// init common
common.init(ini);

//configure app setting
require('./config/main')(app, ini);

// include api routes
require('./api/route')(app, ini);

// include dashboard routes
require('./dashboard/route')(app, ini);

// Handle https
if (ini.security.https) {
	var credentials = common.loadCredentials(ini);
	if (!credentials) {
		console.log("Error reading HTTPS credentials");
		process.exit(-1);
	}
	server = https.createServer(credentials, app);
} else {
	server = http.createServer(app);
}

// Start listening
var info = JSON.parse(fs.readFileSync("./package.json", 'utf-8'));
console.log(info.description+" v"+info.version);
console.log("node v"+process.versions.node);
console.log("Settings file './env/config.ini'");
server.listen(ini.web.port, function() {
	console.log("Server is listening on"+(ini.security.https ? " secure":"")+" port " + ini.web.port + "...");
}).on('error', function(err) {
	console.log("Ooops! cannot launch Server on port "+ ini.web.port+", error code "+err.code);
	process.exit(-1);
});

//export app for testing
module.exports = app;
