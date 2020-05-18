// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

// main landing page
exports.index = function(req, res) {
	res.render('home', {
		module: 'home',
		server: ini.information,
		account: req.session.user
	});
};
