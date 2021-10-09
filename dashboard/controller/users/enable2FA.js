// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate'),
	qrCodeUtil = require('../../../api/controller/utils/qrCodeUtil');

var users = require('./index');


module.exports = function enable2FA(req, res) {
		
	if (req.method == 'POST') {

		req.assert('tokenentry', {
			text: 'token-at-least',
			params: {
				count: users.ini().security.min_token_size
			}
		}).len(users.ini().security.min_token_size);

		req.assert('tokenentry', {text: 'token-invalid'}).matches(regexValidate('tokenentry'));

		var otpToken = req.body.tokenentry;

		// get errors
		var errors = req.validationErrors();

		if (!errors){
			superagent
				.put(common.getAPIUrl(req) + 'api/v1/profile/enable2FA')
				.set(common.getHeaders(req))
				.send({
					userToken: otpToken
				})
				.end(function (error, response) {
					if (response.statusCode == 200) {
						req.flash('success', {
							msg: {
								text: 'totp-enabled',
							}
						});
						return res.redirect('/profile');
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.redirect('/profile/enable2FA');
					}
				});
		} else {
			req.flash('errors', {
				msg: {
					text: 'token-invalid',
				}
			});
			return res.redirect('/profile/enable2FA');
		}
	} else {
		superagent
			.get(common.getAPIUrl(req) + 'api/v1/profile/enable2FA')
			.set(common.getHeaders(req))
			.end(function (error, response) {
				if (error) {
					req.flash('errors', {
						msg: {
							text: 'there-is-error'
						}
					});
					return res.redirect('/');
				} else if (response.statusCode == 200) {
					//get user, otpAUth and UniqueSecret Response from api.
					var user = response.body.user;
					var otpAuth = response.body.otpAuth;
					var uniqueSecret = response.body.uniqueSecret;

					//generate QR code then render page.
					qrCodeUtil.generateQRCode(otpAuth).then(function (result) {
						res.render('twoFactor', {
							module: 'twoFactor',
							mode: 'enabletotp',
							user: user,
							uniqueSecret: uniqueSecret,
							twoFactorqr: result.image,
							account: req.session.user,
							server: users.ini().information
						});
					});
				} else {
					req.flash('errors', {
						msg: {
							text: 'error-code-'+user.code
						}
					});
					return res.redirect('/profile/enable2FA');
				}
			});
	}
};
