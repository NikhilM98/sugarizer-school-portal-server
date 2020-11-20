// include libraries
var superagent = require('superagent'),
	purify = require('dompurify'),
	common = require('../../../helper/common'),
	regexValidate = require('../../../helper/regexValidate');

var deployments = require('./index');

module.exports = function requestDeployment(req, res) {

	if (req.method == 'POST') {
		// validate

		req.body.name = req.body.name ? req.body.name.trim() : '';
		req.assert('name', {text: 'name-invalid'}).matches(regexValidate('name'));

		req.body.school_short_name = req.body.school_short_name ? req.body.school_short_name.trim() : '';
		req.assert('school_short_name', {text: 'school-short-name-invalid'}).matches(regexValidate('short-name'));

		req.body.school_address = req.body.school_address ? req.body.school_address.trim() : '';
		req.assert('school_address', {text: 'school-address-invalid'}).matches(regexValidate('address'));

		req.body.students_count = req.body.students_count ? req.body.students_count.trim() : '';
		req.assert('students_count', {text: 'students-count-invalid'}).matches(regexValidate('number'));

		req.body.classrooms_count = req.body.classrooms_count ? req.body.classrooms_count.trim() : '';
		req.assert('classrooms_count', {text: 'classrooms-count-invalid'}).matches(regexValidate('number'));

		req.body.student_grade = req.body.student_grade ? req.body.student_grade.trim() : '';
		req.assert('student_grade', {text: 'student-grade-invalid'}).notEmpty();

		req.body.teachers_count = req.body.teachers_count ? req.body.teachers_count.trim() : '';
		req.assert('teachers_count', {text: 'teachers-count-invalid'}).matches(regexValidate('number'));

		req.body.device_count = req.body.device_count ? req.body.device_count.trim() : '';
		req.assert('device_count', {text: 'device-count-invalid'}).matches(regexValidate('number'));

		req.body.device_info = req.body.device_info ? req.body.device_info.trim() : '';
		req.assert('device_info', {text: 'device-info-invalid'}).matches(regexValidate('devices'));

		req.body.deployment_description = req.body.deployment_description ? purify.sanitize(req.body.deployment_description.trim()) : '';

		// get errors
		var errors = req.validationErrors();

		if (!errors) {
			superagent
				.post(common.getAPIUrl(req) + 'api/v1/deployments')
				.set(common.getHeaders(req))
				.send({
					deployment: JSON.stringify(req.body)
				})
				.end(function (error, response) {
					if (response.statusCode == 200) {
						req.flash('success', {
							msg: {
								text: 'deployment-requested',
								params: {
									name: req.body.name
								}
							}
						});
						return res.redirect('/deployments');
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.redirect('/deployments/request');
					}
				});
		} else {
			req.flash('errors', errors);
			return res.render('addEditDeployment', {
				module: 'deployments',
				deployment: req.body,
				mode: "add",
				tab: 'deployment',
				account: req.session.user,
				server: deployments.ini().information
			});
		}
	} else {
		res.render('addEditDeployment', {
			module: 'deployments',
			mode: "add",
			tab: 'deployment',
			account: req.session.user,
			server: deployments.ini().information
		});
	}
};
