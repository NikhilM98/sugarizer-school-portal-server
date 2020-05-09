var express = require('express'),
	bodyParser = require('body-parser'),
	logger = require('morgan'),
	expressValidator = require('express-validator'),
	cors = require('cors');
var artificialDelay = 0;

// configure app settings
module.exports = function(app, ini) {

	// add an artificial delay for debug
	if (artificialDelay) {
		app.use(function(req,res,next) {
			setTimeout(next, artificialDelay);
		});
	}

	//include body parser
	app.use(bodyParser.urlencoded({
		limit: '256mb',
		extended: false
	}));
	app.use(bodyParser.json({
		limit: '256mb',
		type: 'application/json'
	}));

	//include expressValidator
	app.use(expressValidator());

	//logger
	if (process.env.NODE_ENV !== 'test') {
		var level = ini.log?ini.log.level:1;
		if (level != 0) {
			app.use(logger('dev'));
		}
	}

	// Handle CORS request
	app.use(cors());

	// Add headers
	app.use(function(req, res, next) {
		if (!res.headersSent) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
			res.setHeader('Access-Control-Allow-Headers', 'x-key,x-access-token');
		}
		next();
	});

	// header's fix
	app.use(function(req, res, next) {
		var _send = res.send;
		var sent = false;
		res.send = function(data) {
			if (sent) return;
			_send.bind(res)(data);
			sent = true;
		};
		next();
	});

	// Set .html as the default template extension
	app.set('view engine', 'ejs');

	// Tell express where it can find the templates
	app.set('views', __dirname + '/../dashboard/views');

	// Make the files in the public folder available to the world
	app.use('/public', express.static(__dirname + '/../dashboard/public'));

};
