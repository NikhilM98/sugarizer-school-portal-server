let otplib = require('otplib');
let qrcode = require('qrcode');

module.exports = async function twoFactor(user) {
  
	let service = 'Sugarizer School Portal';
	let secret = otplib.authenticator.generateSecret();

	let otpAuth = otplib.authenticator.keyuri(
		encodeURIComponent(user),
		encodeURIComponent(service),
		secret
	);
  
	try {
		const QRCodeImageUrl = await qrcode.toDataURL(otpAuth);
		return {image:`<img src='${QRCodeImageUrl}' alt='qr-code-img' />`,
			secret: secret
		};
	} catch (error) {
		console.log("Could not generate QR code", error);
		return;
	}
};
