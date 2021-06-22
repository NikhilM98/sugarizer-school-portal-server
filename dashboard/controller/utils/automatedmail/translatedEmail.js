var enJSON = require('../../../public/i18n/en.json'),
	hiJSON = require('../../../public/i18n/hi.json'),
	frJSON = require('../../../public/i18n/fr.json'),
	esJSON = require('../../../public/i18n/es.json');

var mailHtml, subject, sspName, sincerely, automatedText, emailbody0, emailbody1, emailDear, emailVerify, emailLogin, sspTeam;

exports.generateMail = function (language, userName, hostName, sid) {

	if (language == "en" || !language){
		sspName = enJSON['sspName'];
		sspTeam = enJSON['ssp-team'];
		subject = enJSON['email-subject'];

		emailDear = replaceTranslate(userName).enDear;
		emailbody0 = enJSON['email-body0'];
		emailbody1 = enJSON['email-body1'];
		emailVerify = enJSON['email-Verify'];
		emailLogin = enJSON['email-Login'];
		sincerely = enJSON['email-sincerely'];
		automatedText = enJSON['email-automatedText'];
	} else if (language == "hi"){
		sspName = hiJSON['sspName'];
		sspTeam = hiJSON['ssp-team'];
		subject = hiJSON['email-subject'];

		emailDear = replaceTranslate(userName).hiDear;
		emailbody0 = hiJSON['email-body0'];
		emailbody1 = hiJSON['email-body1'];
		emailVerify = hiJSON['email-Verify'];
		emailLogin = hiJSON['email-Login'];
		sincerely = hiJSON['email-sincerely'];
		automatedText = hiJSON['email-automatedText'];
	} else if (language == "fr"){
		sspName = frJSON['sspName'];
		sspTeam = frJSON['ssp-team'];
		subject = frJSON['email-subject'];

		emailDear = replaceTranslate(userName).frDear;
		emailbody0 = frJSON['email-body0'];
		emailbody1 = frJSON['email-body1'];
		emailVerify = frJSON['email-Verify'];
		emailLogin = frJSON['email-Login'];
		sincerely = frJSON['email-sincerely'];
		automatedText = frJSON['email-automatedText'];
	} else if (language == "es"){
		sspName = esJSON['sspName'];
		sspTeam = esJSON['ssp-team'];
		subject = esJSON['email-subject'];

		emailDear = replaceTranslate(userName).esDear;
		emailbody0 = esJSON['email-body0'];
		emailbody1 = esJSON['email-body1'];
		emailVerify = esJSON['email-Verify'];
		emailLogin = esJSON['email-Login'];
		sincerely = esJSON['email-sincerely'];
		automatedText = esJSON['email-automatedText'];
	} 
    
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
			${emailDear}<br>${emailbody0}<br>
			<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}/signup/${sid}" target="_blank">
			${emailVerify}
			</a><br>
			${emailbody1}
			<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}" target="_blank">
			${emailLogin}</a> <br>
				<p style="Margin-top: 20px;Margin-bottom: 0;">${sincerely} <br> ${sspTeam}</p>
				<p class="size-8" style="mso-text-raise: 9px;Margin-top: 20px;Margin-bottom: 0;font-size: 8px;line-height: 14px;" lang="x-size-8">
				${automatedText}
				</p>
			</div>
		</div>
	</div>`;

	return {sspName, subject, mailHtml};
};

function replaceTranslate (userName){
	var enDear = enJSON['email-dear'].replace("{{userName}}", userName);
	var hiDear = hiJSON['email-dear'].replace("{{userName}}", userName);
	var frDear = frJSON['email-dear'].replace("{{userName}}", userName);
	var esDear = esJSON['email-dear'].replace("{{userName}}", userName);
	return {enDear, hiDear, frDear, esDear};
}

