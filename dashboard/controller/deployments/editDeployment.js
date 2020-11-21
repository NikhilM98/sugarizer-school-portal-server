// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	validator = require('validator'),
	regexValidate = require('../../../helper/regexValidate');

var deployments = require('./index');

module.exports = function editDeployment(req, res) {
	if (req.params.did) {
		if (req.method == 'POST') {
			// validate

			delete req.body.school_short_name;
			delete req.body.deployed;
			delete req.body.status;

			req.body.name = req.body.name ? req.body.name.trim() : '';
			if (req.body.name) {
				req.assert('name', {text: 'name-invalid'}).matches(regexValidate('name'));
			} else {
				delete req.body.name;
			}

			req.body.school_address = req.body.school_address ? req.body.school_address.trim() : '';
			if (req.body.school_address) {
				req.assert('school_address', {text: 'school-address-invalid'}).matches(regexValidate('address'));
			} else {
				delete req.body.school_address;
			}

			req.body.students_count = req.body.students_count ? req.body.students_count.trim() : '';
			if (req.body.students_count) {
				req.assert('students_count', {text: 'students-count-invalid'}).matches(regexValidate('number'));
			} else {
				delete req.body.students_count;
			}

			req.body.classrooms_count = req.body.classrooms_count ? req.body.classrooms_count.trim() : '';
			if (req.body.classrooms_count) {
				req.assert('classrooms_count', {text: 'classrooms-count-invalid'}).matches(regexValidate('number'));
			} else {
				delete req.body.classrooms_count;
			}

			req.body.student_grade = req.body.student_grade ? req.body.student_grade.trim() : '';
			if (req.body.student_grade) {
				req.assert('student_grade', {text: 'student-grade-invalid'}).notEmpty();
			} else {
				delete req.body.student_grade;
			}

			req.body.teachers_count = req.body.teachers_count ? req.body.teachers_count.trim() : '';
			if (req.body.teachers_count) {
				req.assert('teachers_count', {text: 'teachers-count-invalid'}).matches(regexValidate('number'));
			} else {
				delete req.body.teachers_count;
			}

			req.body.device_count = req.body.device_count ? req.body.device_count.trim() : '';
			if (req.body.device_count) {
				req.assert('device_count', {text: 'device-count-invalid'}).matches(regexValidate('number'));
			} else {
				delete req.body.device_count;
			}

			req.body.device_info = req.body.device_info ? req.body.device_info.trim() : '';
			if (req.body.device_info) {
				req.assert('device_info', {text: 'device-info-invalid'}).matches(regexValidate('devices'));
			} else {
				delete req.body.device_info;
			}

			req.body.deployment_description = req.body.deployment_description ? validator.escape(req.body.deployment_description.trim()) : '';
			if (req.body.deployment_description) {
				req.assert('deployment_description', {text: 'deployment-description-invalid'}).matches(regexValidate('deployment-description'));
			} else {
				delete req.body.deployment_description;
			}

			if (Object.keys(req.body).length === 0) {
				req.flash('errors', {
					msg: {
						text: 'error-code-13'
					}
				});
			}

			// get errors
			var errors = req.validationErrors();

			if (!errors) {
				superagent
					.put(common.getAPIUrl(req) + 'api/v1/deployments/' + req.params.did)
					.set(common.getHeaders(req))
					.send({
						deployment: JSON.stringify(req.body)
					})
					.end(function (error, response) {
						if (response.statusCode == 200) {
							req.flash('success', {
								msg: {
									text: 'deployment-updated',
									params: {
										name: req.body.name
									}
								}
							});
							return res.redirect('/deployments/edit/' + req.params.did);
						} else {
							req.flash('errors', {
								msg: {
									text: 'error-code-'+response.body.code
								}
							});
							return res.redirect('/deployments/edit/' + req.params.did);
						}
					});
			} else {
				req.flash('errors', errors);
				return res.redirect('/deployments/edit/' + req.params.did);
			}
		} else {
			superagent
				.get(common.getAPIUrl(req) + 'api/v1/deployments/' + req.params.did)
				.set(common.getHeaders(req))
				.end(function (error, response) {
					var user = response.body;
					if (error) {
						req.flash('errors', {
							msg: {
								text: 'there-is-error'
							}
						});
						return res.redirect('/deployments');
					} else if (response.statusCode == 200) {
						// send to deployments page
						res.render('addEditDeployment', {
							module: 'deployments',
							deployment: response.body,
							mode: "edit",
							tab: 'deployment',
							account: req.session.user,
							server: deployments.ini().information
						});
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+user.code
							}
						});
						return res.redirect('/deployments');
					}
				});
		}
	} else {
		req.flash('errors', {
			msg: {
				text: 'there-is-error'
			}
		});
		return res.redirect('/deployments');
	}
};
