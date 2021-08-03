let authenticator = require('otplib');
let qrcode = require('qrcode');

module.exports = function twoFactor(user) {

	let service = 'Sugarizer School Portal';
	let secret = authenticator.generateSecret();
	let token = authenticator.generate(secret);
	let isValid = false;

	let otp = authenticator.keyuri(
		encodeURIComponent(user),
		encodeURIComponent(service),
		secret
	);

	let imagePath = '';

	qrcode.toDataURL(otp, (err, imageUrl) => {
		if (err) {
			console.log('Could not generate QR code', err);
			return;
		}
		imagePath = imageUrl;
	});
	return imagePath, token, isValid;
};

