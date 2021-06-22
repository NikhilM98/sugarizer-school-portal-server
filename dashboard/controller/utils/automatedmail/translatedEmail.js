var enJSON = require('../../../public/i18n/en.json'),
	hiJSON = require('../../../public/i18n/hi.json'),
	frJSON = require('../../../public/i18n/fr.json'),
	esJSON = require('../../../public/i18n/es.json');

var mailHtml, subject, sspName, sincerely, automatedText, emailbody0, emailbody1, emailDear, emailVerify, emailLogin, sspTeam;

exports.generateMail = function (language, userName, hostName, sid) {

	var signup = createAnchor(`${hostName}/signup/${sid}`, translate(language, 'email-here'));
	var login = createAnchor(`${hostName}`, translate(language, 'email-here'));

	emailVerify = translate(language, 'email-Verify').replace("{{link}}", signup);
	emailLogin = translate(language, 'email-Login').replace("{{link}}", login);

	sspName = translate(language, 'sspName');
	sspTeam = translate(language, 'ssp-team');
	subject = translate(language, 'email-subject');

	emailDear = translate(language, 'email-dear').replace("{{userName}}", userName);
	emailbody0 = translate(language, 'email-body0');
	emailbody1 = translate(language, 'email-body1');
	sincerely = translate(language, 'email-sincerely');
	automatedText = translate(language, 'email-automatedText');
    
	//mail html that'll be sent to the user using nodemailer.
	mailHtml = `<div style="text-align: left;color: #202124;font-size: 14px;line-height: 21px;font-family: sans-serif;">
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				<h2 style="Margin-top: 0;Margin-bottom: 16px;font-style: normal;font-weight: normal;color: #ab47bc;font-size: 26px;line-height: 34px;font-family: Avenir,sans-serif;text-align: center;">
					<strong>${sspName}</strong>
				</h2>
			</div>
		</div>
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				${emailDear}<br>${emailbody0}<br>${emailVerify}<br>${emailbody1}${emailLogin}<br>
				<p style="Margin-top: 20px;Margin-bottom: 0;">${sincerely} <br> ${sspTeam}</p>
				<p class="size-8" style="mso-text-raise: 9px;Margin-top: 20px;Margin-bottom: 0;font-size: 8px;line-height: 14px;" lang="x-size-8">
				${automatedText}
				</p>
			</div>
		</div>
	</div>`;

	return {sspName, subject, mailHtml};
};

function translate (language, key) {
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

function createAnchor (url, hrefText){
	return `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href=${url} target="_blank">${hrefText}</a>`;
}
