var auth = require('./index');

module.exports = function checkRole(adminRoute, moderatorRoute, clientRoute) {
	return function(req, res, next){
		if (req.session && req.session.user && req.session.user.user) {
			if (req.session.user.user.role == "admin") {
				adminRoute(req, res, next);
			} else if (req.session.user.user.role == "moderator") {
				if (!moderatorRoute) {
					return res.render('404', {
						"server": auth.ini().information,
						"message": "Route Not Found!",
						"url": req.protocol + '://' + req.get('host') + req.originalUrl
					});
				}
				moderatorRoute(req, res, next);
			} else if (req.session.user.user.role == "client") {
				if (!clientRoute) {
					return res.render('404', {
						"server": auth.ini().information,
						"message": "Route Not Found!",
						"url": req.protocol + '://' + req.get('host') + req.originalUrl
					});
				}
				clientRoute(req, res, next);
			} else {
				res.redirect('/login');
			}
		} else {
			res.redirect('/login');
		}
	};
};
