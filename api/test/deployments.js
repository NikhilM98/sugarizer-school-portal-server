// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
var server = require('../../index.js');
var chai = require('chai');
var chaiHttp = require('chai-http');
var timestamp = +new Date();

//fake users
var fakeUser = {
	'admin': '{"name":"Fake Admin ' + (timestamp.toString()) + '","username":"fake_admin_' + (timestamp.toString()) + '","password":"sugarizer","language":"en","role":"admin"}',
	'client': '{"name":"Fake Client ' + (timestamp.toString()) + '","email":"fake_client_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"es","role":"client"}',
	'moderator': '{"name":"Fake Moderator ' + (timestamp.toString()) + '","username":"fake_moderator_' + (timestamp.toString()) + '","password":"sugarizer","language":"fr","role":"moderator"}',
	'deployment1': '{"name":"Fake Deployment 1 ' + (timestamp.toString()) + '","school_short_name":"fake-deployment-1-' + (timestamp.toString()) + '","school_address":"Test Alpha School Address","students_count":"312","classrooms_count":"12","student_grade":"3-4","teachers_count":"43","device_count":"326","device_info":"desktop"}',
	'deployment2': '{"name":"Fake Deployment 2 ' + (timestamp.toString()) + '","school_short_name":"fake-deployment-2-' + (timestamp.toString()) + '","school_address":"Test Beta School Address","students_count":"423","classrooms_count":"43","student_grade":"1-4","teachers_count":"54","device_count":"213","device_info":"mobile"}',
	'deployment3': '{"name":"Fake Deployment 3 ' + (timestamp.toString()) + '","school_short_name":"fake-deployment-3-' + (timestamp.toString()) + '","school_address":"Test Charlie School Address","students_count":"512","classrooms_count":"32","student_grade":"5-10","teachers_count":"31","device_count":"96","device_info":"tablet"}',
	'deployment_approved': '{"name":"Fake Deployment Approved ' + (timestamp.toString()) + '","school_short_name":"fake-deployment-approved-' + (timestamp.toString()) + '","school_address":"Test Delta School Address","students_count":"632","classrooms_count":"21","student_grade":"6-12","teachers_count":"21","device_count":"132","device_info":"desktop","status":"1"}',
	'deployment_missing_name': '{"school_short_name":"fake-deployment-missing-name-' + (timestamp.toString()) + '","school_address":"Test Delta School Address","students_count":"632","classrooms_count":"21","student_grade":"6-12","teachers_count":"21","device_count":"132","device_info":"desktop"}',
	'deployment_missing_shortname': '{"name":"Fake Deployment Missing Short Name ' + (timestamp.toString()) + '","school_address":"Test Delta School Address","students_count":"632","classrooms_count":"21","student_grade":"6-12","teachers_count":"21","device_count":"132","device_info":"desktop"}'
};

//init server
chai.use(chaiHttp);
chai.should();


describe('Deployments', function () {
	// create & login user and store access key
	before((done) => {
		// delay for db connection for establish
		setTimeout(function () {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.admin
				})
				.end(() => {
					//login user
					chai.request(server)
						.post('/auth/login')
						.send({
							"user": fakeUser.admin
						})
						.end((err, res) => {
							//store user data
							fakeUser.admin = res.body;
							chai.request(server)
								.post('/auth/signup')
								.send({
									"user": fakeUser.client
								})
								.end(() => {
									//login user
									chai.request(server)
										.post('/auth/login')
										.send({
											"user": fakeUser.client
										})
										.end((err, res) => {
											//store user data
											fakeUser.client = res.body;
											chai.request(server)
												.post('/auth/signup')
												.send({
													"user": fakeUser.moderator
												})
												.end(() => {
													//login user
													chai.request(server)
														.post('/auth/login')
														.send({
															"user": fakeUser.moderator
														})
														.end((err, res) => {
															//store user data
															fakeUser.moderator = res.body;
															done();
														});
												});
										});
								});
						});
				});
		}, 300);
	});

	describe('/POST deployments', () => {
		it('it should add a deployment by admin', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					"deployment": fakeUser.deployment1
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.deployment1 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Deployment 1 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-1-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Alpha School Address");
					res.body.should.have.property('students_count').eql("312");
					res.body.should.have.property('classrooms_count').eql("12");
					res.body.should.have.property('student_grade').eql("3-4");
					res.body.should.have.property('teachers_count').eql("43");
					res.body.should.have.property('device_count').eql("326");
					res.body.should.have.property('device_info').eql("desktop");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.admin.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
        
		it('it should add a deployment by client', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					"deployment": fakeUser.deployment2
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.deployment2 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Beta School Address");
					res.body.should.have.property('students_count').eql("423");
					res.body.should.have.property('classrooms_count').eql("43");
					res.body.should.have.property('student_grade').eql("1-4");
					res.body.should.have.property('teachers_count').eql("54");
					res.body.should.have.property('device_count').eql("213");
					res.body.should.have.property('device_info').eql("mobile");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
        
		it('it should add a deployment by moderator', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					"deployment": fakeUser.deployment3
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.deployment3 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Deployment 3 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-3-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Charlie School Address");
					res.body.should.have.property('students_count').eql("512");
					res.body.should.have.property('classrooms_count').eql("32");
					res.body.should.have.property('student_grade').eql("5-10");
					res.body.should.have.property('teachers_count').eql("31");
					res.body.should.have.property('device_count').eql("96");
					res.body.should.have.property('device_info').eql("tablet");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.moderator.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
        
		it('it should not add a duplicate deployment', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					"deployment": JSON.stringify(fakeUser.deployment1)
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(18);
					done();
				});
		});
        
		it('it should not add a deployment with missing name', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					"deployment": fakeUser.deployment_missing_name
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(16);
					done();
				});
		});
        
		it('it should not add a deployment with missing school short name', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					"deployment": fakeUser.deployment_missing_shortname
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(16);
					done();
				});
		});
        
		it('it should not add an approved deployment by client', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					"deployment": fakeUser.deployment_approved
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should not add an approved deployment by moderator', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					"deployment": fakeUser.deployment_approved
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should add an approved deployment by admin', (done) => {
			chai.request(server)
				.post('/api/v1/deployments/')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					"deployment": fakeUser.deployment_approved
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.deployment_approved = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Deployment Approved " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-approved-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Delta School Address");
					res.body.should.have.property('students_count').eql("632");
					res.body.should.have.property('classrooms_count').eql("21");
					res.body.should.have.property('student_grade').eql("6-12");
					res.body.should.have.property('teachers_count').eql("21");
					res.body.should.have.property('device_count').eql("132");
					res.body.should.have.property('device_info').eql("desktop");
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.admin.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
	});

	describe('/GET/:id deployments', () => {
		it('it should return nothing on invalid id', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});

		it('it should return nothing on inexisting id', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.eql({});
					done();
				});
		});
        
		it('it should return right deployment by id for admin', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Beta School Address");
					res.body.should.have.property('students_count').eql("423");
					res.body.should.have.property('classrooms_count').eql("43");
					res.body.should.have.property('student_grade').eql("1-4");
					res.body.should.have.property('teachers_count').eql("54");
					res.body.should.have.property('device_count').eql("213");
					res.body.should.have.property('device_info').eql("mobile");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should not return deployment by id for unauthorized client', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should return right deployment by id for authorized client', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Beta School Address");
					res.body.should.have.property('students_count').eql("423");
					res.body.should.have.property('classrooms_count').eql("43");
					res.body.should.have.property('student_grade').eql("1-4");
					res.body.should.have.property('teachers_count').eql("54");
					res.body.should.have.property('device_count').eql("213");
					res.body.should.have.property('device_info').eql("mobile");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should return right deployment by id for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Beta School Address");
					res.body.should.have.property('students_count').eql("423");
					res.body.should.have.property('classrooms_count').eql("43");
					res.body.should.have.property('student_grade').eql("1-4");
					res.body.should.have.property('teachers_count').eql("54");
					res.body.should.have.property('device_count').eql("213");
					res.body.should.have.property('device_info').eql("mobile");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
	});

	describe('/PUT/:id deployments', () => {
		it('it should do nothing on invalid deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"school_address":"Test Updated School Address"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});

		it('it should do nothing on inexisting deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"school_address":"Test Updated School Address"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should update the valid deployment by admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"school_address":"Test Updated School Address"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test Updated School Address");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should not update the deployment by unauthorized client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					deployment: '{"school_address":"Test Updated School Address"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should update the valid deployment by authorized client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					deployment: '{"school_address":"Test School Address Updated"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('school_address').eql("Test School Address Updated");
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});
        
		it('it should not update the deployment by unauthorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					deployment: '{"school_address":"Test Updated School Address"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should update the valid deployment by authorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					deployment: '{"school_address":"Test School Updated Address"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment3._id);
					res.body.should.have.property('name').eql("Fake Deployment 3 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-3-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.moderator.user._id);
					done();
				});
		});

		it('it should not change the school short name for deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"school_short_name":"fake-deployment-2-updated"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should not change the deployed for deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"deployed":true}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should not change the user id for deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"user_id":"' + fakeUser.admin.user._id + '"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should not change the status for deployment by client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					deployment: '{"status":"2"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should not change the status for deployment by moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					deployment: '{"status":"2"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment3._id);
					res.body.should.have.property('name').eql("Fake Deployment 3 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-3-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(0);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.moderator.user._id);
					done();
				});
		});
        
		it('it should change the status for deployment by admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"status":"2"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(2);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});
	});
    
	describe('/PUT/status:id deployments', () => {
		it('it should do nothing on invalid deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing on inexisting deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing if status not defined', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"status":"1"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(16);
					done();
				});
		});

		it('it should not change the status for deployment by client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not change the status for deployment by moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should change the status for deployment by admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});
	});
    
	describe('/PUT/deploy:id deployments', () => {
		it('it should do nothing on invalid deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing on inexisting deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing if deployed not defined', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployment: '{"deployed":true}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(16);
					done();
				});
		});

		it('it should not deploy the deployment by client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not deploy the deployment by moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should not deploy unapproved deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});

		it('it should not undeploy unapproved deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: false
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});

		it('it should deploy approved deployment by admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(true);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should do nothing to deploy already deployed deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: true
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(true);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should undeploy approved deployment by admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: false
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should do nothing to undeploy already undeployed deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: false
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('name').eql("Fake Deployment 2 " + (timestamp.toString()));
					res.body.should.have.property('school_short_name').eql("fake-deployment-2-" + (timestamp.toString()));
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(false);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});
	});
    
	describe('/PUT/adduser:id deployments', () => {
		before((done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					status: 1
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(false);
					chai.request(server)
						.put('/api/v1/deployments/deploy/' + fakeUser.deployment3._id)
						.set('x-access-token', fakeUser.admin.token)
						.set('x-key', fakeUser.admin.user._id)
						.send({
							deployed: true
						})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.be.an('object');
							res.body.should.have.property('deployed').eql(true);
							chai.request(server)
								.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
								.set('x-access-token', fakeUser.admin.token)
								.set('x-key', fakeUser.admin.user._id)
								.send({
									deployed: true
								})
								.end((err, res) => {
									res.should.have.status(200);
									res.body.should.be.an('object');
									res.body.should.have.property('deployed').eql(true);
									done();
								});
						});
				});
		});

		it('it should do nothing on invalid deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing on inexisting deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing if username not defined', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});
        
		it('it should do nothing if password not defined', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"username":"admin"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});
        
		it('it should do nothing on inactive deployment', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(500);
					res.body.code.should.be.eql(22);
					done();
				});
		});

		it('it should add a user for admin', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(true);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should do nothing for unauthorized client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment_approved._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should add a user for authorized client', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.send({
					user: '{"username":"admin1","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment2._id);
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(true);
					res.body.should.have.property('user_id').eql(fakeUser.client.user._id);
					done();
				});
		});

		it('it should do nothing for unauthorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment_approved._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					user: '{"username":"admin","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should add a user for authorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/deployments/adduser/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.send({
					user: '{"username":"admin1","password":"password"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.deployment3._id);
					res.body.should.have.property('status').eql(1);
					res.body.should.have.property('deployed').eql(true);
					res.body.should.have.property('user_id').eql(fakeUser.moderator.user._id);
					done();
				});
		});
	});
    
	describe('/GET deployments', () => {
		before((done) => {
			chai.request(server)
				.put('/api/v1/deployments/status/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					status: 2
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					fakeUser.deployment1 = res.body;
					res.body.should.have.property('status').eql(2);
					res.body.should.have.property('deployed').eql(false);
					done();        
				});
		});

		it('it should return all the deployments for admin', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					status: "all"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					done();
				});
		});
        
		it('it should return only his deployments for client', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.query({
					status: "all"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					for (var i = 0; i < res.body.deployments.length; i++) {
						res.body.deployments[i].should.be.an('object');
						res.body.deployments[i].should.have.property('_id').not.eql(undefined);
						res.body.deployments[i].should.have.property('name').not.eql(undefined);
						res.body.deployments[i].should.have.property('school_short_name').not.eql(undefined);
						res.body.deployments[i].should.have.property('user_id').eql(fakeUser.client.user._id);
					}
					done();
				});
		});
        
		it('it should return all the deployments for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.query({
					status: "all"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					done();
				});
		});
        
		it('it should return all approved deployments', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					status: "1"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					for (var i = 0; i < res.body.deployments.length; i++) {
						res.body.deployments[i].should.be.an('object');
						res.body.deployments[i].should.have.property('_id').not.eql(undefined);
						res.body.deployments[i].should.have.property('name').not.eql(undefined);
						res.body.deployments[i].should.have.property('school_short_name').not.eql(undefined);
						res.body.deployments[i].should.have.property('status').eql(1);
					}
					done();
				});
		});
        
		it('it should return all deployed deployments', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					status: "deployed"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					for (var i = 0; i < res.body.deployments.length; i++) {
						res.body.deployments[i].should.be.an('object');
						res.body.deployments[i].should.have.property('_id').not.eql(undefined);
						res.body.deployments[i].should.have.property('name').not.eql(undefined);
						res.body.deployments[i].should.have.property('school_short_name').not.eql(undefined);
						res.body.deployments[i].should.have.property('status').eql(1);
						res.body.deployments[i].should.have.property('deployed').eql(true);
					}
					done();
				});
		});

		it('it should return all rejected deployments', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					status: "2"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.should.be.an('array');
					res.body.deployments.length.should.be.above(0);
					for (var i = 0; i < res.body.deployments.length; i++) {
						res.body.deployments[i].should.be.an('object');
						res.body.deployments[i].should.have.property('_id').not.eql(undefined);
						res.body.deployments[i].should.have.property('name').not.eql(undefined);
						res.body.deployments[i].should.have.property('school_short_name').not.eql(undefined);
						res.body.deployments[i].should.have.property('status').eql(2);
					}
					done();
				});
		});

		it('it should return all matched deployments with partial search', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					q: "fake"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.length.should.be.gte(1);
					done();
				});
		});
        
		it('it should return all deployments after a timestamp', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					stime: fakeUser.deployment1.timestamp
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.length.should.be.gte(1);
					done();
				});
		});
        
		it('it should not return deployments for a future timestamp', (done) => {
			chai.request(server)
				.get('/api/v1/deployments')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.query({
					stime: 1 + fakeUser.deployment1.timestamp
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.deployments.length.should.be.eql(0);
					done();
				});
		});
	});

	describe('/DELETE/:id deployments', () => {
		before((done) => {
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: false
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('deployed').eql(false);
					chai.request(server)
						.put('/api/v1/deployments/deploy/' + fakeUser.deployment2._id)
						.set('x-access-token', fakeUser.admin.token)
						.set('x-key', fakeUser.admin.user._id)
						.send({
							deployed: false
						})
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.be.an('object');
							res.body.should.have.property('deployed').eql(false);
							chai.request(server)
								.put('/api/v1/deployments/deploy/' + fakeUser.deployment_approved._id)
								.set('x-access-token', fakeUser.admin.token)
								.set('x-key', fakeUser.admin.user._id)
								.send({
									deployed: true
								})
								.end((err, res) => {
									res.should.have.status(200);
									res.body.should.be.an('object');
									res.body.should.have.property('deployed').eql(true);
									done();
								});
						});
				});
		});

		it('it should do nothing on invalid deployment', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + 'xxx')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should do nothing on inexisting deployment', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(15);
					done();
				});
		});
        
		it('it should not delete active deployment', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment_approved._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(500);
					res.body.code.should.be.eql(19);
					done();
				});
		});

		it('it should do nothing for unauthorized client', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should delete the deployment for authorized client', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment2._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
        
		it('it should do nothing for unauthorized moderator', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should delete the deployment for authorized moderator', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment3._id)
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});

		it('it should delete the deployment for admin', (done) => {
			chai.request(server)
				.delete('/api/v1/deployments/' + fakeUser.deployment1._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});

		after((done) => {
			// After Approved Dep -> Inactive
			// After Delete Approved Dep
			chai.request(server)
				.put('/api/v1/deployments/deploy/' + fakeUser.deployment_approved._id)
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.send({
					deployed: false
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('deployed').eql(false);
					chai.request(server)
						.delete('/api/v1/deployments/' + fakeUser.deployment_approved._id)
						.set('x-access-token', fakeUser.admin.token)
						.set('x-key', fakeUser.admin.user._id)
						.end((err, res) => {
							res.should.have.status(200);
							done();
						});
				});
		});
	});

	// delete fake user access key
	after((done) => {
		chai.request(server)
			.delete('/api/v1/users/' + fakeUser.moderator.user._id)
			.set('x-access-token', fakeUser.admin.token)
			.set('x-key', fakeUser.admin.user._id)
			.end((err, res) => {
				res.should.have.status(200);
				chai.request(server)
					.delete('/api/v1/users/' + fakeUser.client.user._id)
					.set('x-access-token', fakeUser.admin.token)
					.set('x-key', fakeUser.admin.user._id)
					.end((err, res) => {
						res.should.have.status(200);
						chai.request(server)
							.delete('/api/v1/users/' + fakeUser.admin.user._id)
							.set('x-access-token', fakeUser.admin.token)
							.set('x-key', fakeUser.admin.user._id)
							.end((err, res) => {
								res.should.have.status(200);
								done();
							});
					});
			});
	});
});
