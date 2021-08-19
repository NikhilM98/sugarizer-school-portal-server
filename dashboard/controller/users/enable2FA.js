// include libraries
var superagent = require('superagent'),
	otplib = require('otplib'),
	qrcode = require('qrcode'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

var users = require('./index');

var serviceName = "SchoolPortal";
var uniqueSecret = generateUniqueSecret();

module.exports = function enable2FA(req, res) {
	if (req.session && req.session.user && req.session.user.user && req.session.user.user._id) {
		if (req.method == 'POST') {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/users/' + req.session.user.user._id)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: {
								text: 'there-is-error'
							}
						});
						return res.redirect('/users/enable2FA');
					} else if (response.statusCode == 200) {						
						if (req.body.tokenentry) {
							req.assert('tokenentry', {
								text: 'token-at-least',
								params: {
									count: users.ini().security.min_token_size
								}
							}).len(users.ini().security.min_token_size);
							req.assert('tokenentry', {text: 'token-invalid'}).matches(regexValidate('tokenentry'));
						} else {
							delete req.body.tokenentry;
						}

						// get errors
						var errors = req.validationErrors();
						var otpToken = req.body.tokenentry;
						var isValid = verifyOTPToken(otpToken, uniqueSecret);
						// console.log(isValid, otpToken, uniqueSecret);

						if(isValid) {
							if (!errors) {
								superagent
									.put(common.getAPIUrl(req) + 'api/v1/profile/enable2FA/' + req.session.user.user._id)
									.set(common.getHeaders(req))
									.send({
										state: isValid,
										userToken: uniqueSecret
									})
									.end(function (error, response) {
										if (response.statusCode == 200) {
											req.flash('success', {
												msg: {
													text: 'totp-enabled',
												}
											});
										} else {
											req.flash('errors', {
												msg: {
													text: 'error-code-'+response.body.code
												}
											});
										}
										return res.redirect('/profile/enable2FA');
									});
								
							} else {
								req.flash('errors', errors);
								return res.redirect('/profile/enable2FA');
							}
						} else {
							req.flash('errors', {
								msg: {
									text: 'wrong-totp',
									params: {
										number: otpToken
									}
								}
							});
							return res.redirect('/profile/enable2FA');
						}
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+user.code
							}
						});
						return res.redirect('/profile/enable2FA');
					}
				});
		} else {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/users/' + req.session.user.user._id)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: {
								text: 'there-is-error'
							}
						});
						console.log(error);
						return res.redirect('/');
					} else if (response.statusCode == 200) {
						var otpAuth = generateOTPToken(user.name, serviceName, uniqueSecret);
						generateQRCode(otpAuth).then(result => {
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
						return res.redirect('/');
					}
				});
		}
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/profile');
	}
};

function generateUniqueSecret (){
	return otplib.authenticator.generateSecret();
}

function generateOTPToken (username, serviceName, secret){
	return otplib.authenticator.keyuri(
		encodeURIComponent(username),
		encodeURIComponent(serviceName),
		secret
	);
}

function verifyOTPToken (token, secret) {
	return otplib.authenticator.verify({ token, secret });
	// return authenticator.check(token, secret)
}

async function generateQRCode (otpAuth) {
	try {
		var QRCodeImageUrl = await qrcode.toDataURL(otpAuth);
		return {image: `<img src='${QRCodeImageUrl}' alt='qr-code-img' />`};
	} catch (error) {
		console.log('Could not generate QR code', error);
		return;
	}
}
