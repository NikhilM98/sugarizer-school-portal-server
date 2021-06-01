var lang; // init global variable

function setModalContent(content) {
	document.getElementById('releaseName').innerText= content.name;
	document.getElementById('releaseNamespace').innerText= content.namespace;
	document.getElementById('releaseRevision').innerText= content.revision;
	document.getElementById('releaseUpdated').innerText= content.updated;
	document.getElementById('releaseStatus').innerText= content.status;
	document.getElementById('releaseChart').innerText= content.chart;
	document.getElementById('releaseAppVersion').innerText= content.app_version;
}

function getLocale() {
	var languageSelection = document.getElementById('languageSelection');
	if (languageSelection != null) {
		var langList = ["en", "fr", "hi", "es"];

		if (localStorage.getItem("languageSelection") != null) {
			lang = localStorage.getItem("languageSelection");
			languageSelection.value = lang;
		} else {
			var navigatorLanguage = navigator.language;
			lang = "en";
			for (var i = 0 ; i < langList.length ; i++) {
				if (navigatorLanguage.indexOf(langList[i]) != -1) {
					lang = langList[i];
					localStorage.setItem("languageSelection", lang);
					languageSelection.selectedIndex = i;
					languageSelection.value = lang;
					break;
				}
			}
		}

		var resources = {};

		for (var i=0; i<langList.length; i++) {
			resources[langList[i]] = {
				translation: {},
				response: {}
			};
			resources[langList[i]]["response"] = fetch('/public/i18n/'+langList[i]+'.json').then(function(response){
				return response.json();
			});
		}

		Promise.all(langList.map(function (lang) {
			return resources[lang].response;
		})).then(function (responses) {
			for (var i=0; i<responses.length; i++) {
				resources[langList[i]]["translation"] = responses[i];
			}
			initLocale(resources, lang);
		});
	}
}

function initLocale(locale, lang) {
	moment.locale(lang);
	i18next.init({
		lng: lang,
		fallbackLng: "en",
		resources: locale
	}, function(err, t) {
		jqueryI18next.init(i18next, $, {
			useOptionsAttr: true
		});
		$('#main-content').localize();

		var languageSelection = document.getElementById('languageSelection');
		languageSelection.onchange = function() {
			localStorage.setItem("languageSelection", this.value);
			lang = this.value;
			moment.locale(lang);
			i18next.changeLanguage(this.value);
			$('#main-content').localize();
			fixSelect2Locale("#device_info_select");
		};
		fixSelect2Locale("#device_info_select");
		window.isLocalized = true;
	});
}

function fixSelect2Locale(id, index) {
	if ($(id)) {
		var el = $(id);
		if (el.select2) {
			el.select2("destroy").select2();
		}
	}
}

$(document).ready(function() {
	getLocale();
});

function firstClientVisit() {
	if (localStorage.getItem("visited") != null) {
		return false;
	} else {
		$('#helpModal').modal("show");
		localStorage.setItem("visited", true);
		return true;
	}
}
var textBox = document.getElementById("password-box");
var password = document.getElementById('password');

function passwordStrength() {
	var parentDiv = document.createElement("div");
	
	var meter = document.createElement("METER");
	meter.id = "password-strength-meter";
	meter.max = "4";
	
	var strengthText = document.createElement("p");
	strengthText.id = "password-strength-text";
	strengthText.style.marginTop = "-1.3em";

	parentDiv.appendChild(meter);
	parentDiv.appendChild(strengthText);
	password.insertAdjacentElement('afterend', parentDiv);
	parentDiv.className = "col-md-12";

	var strength = {
        0: "Poor",
        1: "Mediocre",
        2: "Okay",
        3: "Good",
        4: "Strong"
    }

	textBox.addEventListener('input', function() {
		var val = textBox.value;
		var result = zxcvbn(val);
		meter.value = result.score;

			if (val !== "") {
				strengthText.innerHTML = "Strength: " + "<strong>" + strength[result.score] + "</strong>";
			} else {
				strengthText.innerHTML = "";
			}
	});
}

var confirmBox = document.getElementById("confirm-password");

function confirmPassword() {
	var confirmText = document.createElement("p");
	confirmBox.insertAdjacentElement("afterend", confirmText);

	confirmBox.addEventListener('input', function () {
		if (confirmBox.value != ""){
			if (confirmBox.value !== textBox.value){
				confirmText.innerHTML = "<strong>Passwords don't match!</strong>"
				document.getElementById("submit").disabled = true;
			} else if (confirmBox.value === textBox.value){
				document.getElementById("submit").disabled = false;
				confirmText.innerHTML = "<strong>Passwords match!</strong>"
			} else {
				confirmText.innerHTML = "";
			}
		} else {
			confirmText.innerHTML = "";
		}
	})}