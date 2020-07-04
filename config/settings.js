// Load Sugarizer Settings
var fs = require('fs'),
	ini = require('ini');

// Load and parse config.ini
exports.load = function() {

	//validate
	var env = (process.env.NODE_ENV ? process.env.NODE_ENV : 'config');

	//add directory
	var confFile = "./env/" + env + '.ini';

	//check file
	try {
		fs.statSync(confFile);
	} catch (err) {
		console.log("Ooops! cannot load settings file '"+ confFile + "', error code "+err.code);
		process.exit(-1);
	}

	//parse config
	var settings = ini.parse(fs.readFileSync(confFile, 'utf-8'));

	return settings;
};
