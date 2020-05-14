var auth = require('./index');

module.exports = function getLogin(req, res) {
	if (req.session.user) {
		// send to dashboard
		return res.redirect('/');
	} else {
		// send to login page
		res.render('login', {
			title: 'Login',
			server: auth.ini().information
		});
	}
};
