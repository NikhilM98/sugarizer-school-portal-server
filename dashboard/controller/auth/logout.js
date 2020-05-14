module.exports = function logout(req, res) {
	req.session.destroy();
	res.redirect('/login');
};
