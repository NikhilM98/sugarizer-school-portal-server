// init settings
var ini = null;
exports.init = function(settings) {
	ini = settings;
};

// main landing page
exports.index = function(req, res) {
    res.render('dashboard', {
        title: 'dashboard',
        module: 'dashboard',
        server: ini.information
    });
};
