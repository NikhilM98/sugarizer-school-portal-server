
var mailHtml, subject, sspName, mailText, sincerely, automatedText;

exports.generateMail = function (language, userName, hostName, sid) {

	if (language == "en" || !language){
		var href = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}/signup/${sid}" target="_blank">here</a>`;
		var hreflogin = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}" target="_blank">here</a>`;
        
		sspName = "Sugarizer School Portal";
		subject = "Sugarizer School Portal - Email Verification";
		sincerely = `Sincerely, <br> ${sspName} Team`;

		automatedText = `This email was automatically sent by Sugarizer School Portal.`;

		mailText = `Dear, ${userName} <br>
        We have received a request to authorize this email for use with Sugarizer School Portal Server. <br>
        Click ${href} to verify your Sugarizer School Portal email. <br>
        If already verified click ${hreflogin} to login ${automatedText}`;
	} else if (language == "hi"){
		// clickable links with hindi translation for "here" in english.
		var href = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}/signup/${sid}" target="_blank">यहां</a>`;
		var hreflogin = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}" target="_blank">यहां</a>`;

		sspName = "सुगराइज़र स्कूल पोर्टल";
		subject = "सुगराइज़र स्कूल पोर्टल - ईमेल सत्यापन";
		sincerely = `भवदीय, <br>${sspName} टीम`;

		automatedText = `यह ईमेल स्वचालित रूप से सुगराइज़र स्कूल पोर्टल कि तरफ़् से भेजा गया था`;

		mailText = `प्रिय, ${userName} <br>
        सुगराइज़र स्कूल पोर्टल के साथ उपयोग के लिए हमें इस ईमेल को अधिकृत करने का अनुरोध प्राप्त हुआ है, <br>
        ${href} क्लिक करें आपकी सुगराइज़र स्कूल पोर्टल ईमेल सत्यापित करने के लिए <br>
        अगर पहले से सत्यापित है, तो ${hreflogin} क्लिक करें लॉगिन करने के लिए`;
	} else if (language == "fr") {
		// replace with the french alternative of "here" in english
		var href = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}/signup/${sid}" target="_blank">here</a>`;
		var hreflogin = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}" target="_blank">here</a>`;
        
		sspName = "Sugarizer School Portal";
		subject = "Sugarizer School Portal - Email Verification";
		sincerely = `Sincerely, <br> ${sspName} Team`;

		automatedText = `This email was automatically sent by Sugarizer School Portal.`;

		mailText = `Dear, ${userName} <br>
        We have received a request to authorize this email for use with Sugarizer School Portal Server. <br>
        Click ${href} to verify your Sugarizer School Portal email. <br>
        If already verified click ${hreflogin} to login.`;
	} else if (language == "es") {
		// replace with the spanish alternative of "here" in english
		var href = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}/signup/${sid}" target="_blank">here</a>`;
		var hreflogin = `<a style="text-decoration: underline;transition: opacity 0.1s ease-in;color: #18527c;" href="${hostName}" target="_blank">here</a>`;

		sspName = "Sugarizer School Portal";
		subject = "Sugarizer School Portal - Email Verification";
		sincerely = `Sincerely, <br> ${sspName} Team`;

		automatedText = `This email was automatically sent by Sugarizer School Portal.`;

		mailText = `Dear, ${userName} <br>
        We have received a request to authorize this email for use with Sugarizer School Portal Server. <br>
        Click ${href} to verify your Sugarizer School Portal email. <br>
        If already verified click ${hreflogin} to login.`;
	}
    
	//mail html that'll be sent to the user using nodemailer.
	mailHtml = `<div style="text-align: left;color: #202124;font-size: 14px;line-height: 21px;font-family: sans-serif;">
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				<h2 style="Margin-top: 0;Margin-bottom: 16px;font-style: normal;font-weight: normal;color: #ab47bc;font-size: 26px;line-height: 34px;font-family: Avenir,sans-serif;text-align: center;">
					<strong>${sspName}</strong></h2>
			</div>
		</div>
		<div style="Margin-left: 20px;Margin-right: 20px;">
			<div style="mso-line-height-rule: exactly;mso-text-raise: 11px;vertical-align: middle;">
				${mailText}
				<p style="Margin-top: 20px;Margin-bottom: 0;">${sincerely}</p>
				<p class="size-8" style="mso-text-raise: 9px;Margin-top: 20px;Margin-bottom: 0;font-size: 8px;line-height: 14px;" lang="x-size-8">
				${automatedText}
				</p>
			</div>
		</div>
	</div>`;

	return [sspName, subject, mailHtml];
};
