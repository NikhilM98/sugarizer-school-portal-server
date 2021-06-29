var enJSON = require('../../../dashboard/public/i18n/en.json'),
	hiJSON = require('../../../dashboard/public/i18n/hi.json'),
	frJSON = require('../../../dashboard/public/i18n/fr.json'),
	esJSON = require('../../../dashboard/public/i18n/es.json');

exports.generateMail = function(language, userName, hostName, sid) {

	var signup = createAnchor(`${hostName}/signup/${sid}`, translate(language, 'here'));
	var login = createAnchor(`${hostName}`, translate(language, 'here'));

	var emailVerify = translate(language, 'email-verify').replace("{{link}}", signup);
	var emailLogin = translate(language, 'email-already-verified-login').replace("{{link}}", login);

	var sspName = translate(language, 'sugarizer-school-portal');
	var sspTeam = translate(language, 'ssp-team');
	var subject = translate(language, 'email-subject');

	var emailDear = translate(language, 'dear-user').replace("{{userName}}", userName);
	var verRecieved = translate(language, 'verification-request-received');
	var emailSincerely = translate(language, 'email-sincerely');
	var automatedText = translate(language, 'email-automated-text');
    
	//mail html that'll be sent to the user using nodemailer.
	var mailHtml = `<div style="text-align: left;color: #202124;font-size: 14px;line-height: 21px;font-family: sans-serif;">
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				<h2 style="Margin-top: 0;Margin-bottom: 16px;font-style: normal;font-weight: normal;color: #ab47bc;font-size: 26px;line-height: 34px;font-family: Avenir,sans-serif;text-align: center;">
					<strong>${sspName}</strong>
				</h2>
			</div>
		</div>
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				${emailDear}<div>&nbsp;</div>${verRecieved}&nbsp;${emailVerify}<br>${emailLogin}
				<p style="Margin-top: 20px;Margin-bottom: 0;">${emailSincerely}<br>${sspTeam}</p>
				<p class="size-8" style="mso-text-raise: 9px;Margin-top: 20px;Margin-bottom: 0;font-size: 8px;line-height: 14px;" lang="x-size-8">
				${automatedText}
				</p>
			</div>
		</div>
	</div>`;

	return {sspName, subject, mailHtml};
};

function translate(language, key) {
	if(language == "en"){
		return enJSON[key];
	} else if (language == "hi"){
		return hiJSON[key];
	} else if (language == "fr"){
		return frJSON[key];
	} else if (language == "es"){
		return esJSON[key];
	} else {
		return enJSON[key];
	}
}

function createAnchor(url, hrefText){
	return `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href=${url} target="_blank">${hrefText}</a>`;
}
