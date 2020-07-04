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
	'moderator': '{"name":"Fake Moderator ' + (timestamp.toString()) + '","username":"fake_moderator_' + (timestamp.toString()) + '","password":"sugarizer","language":"fr","role":"moderator"}'
};

//init server
chai.use(chaiHttp);
chai.should();

describe('Helm', function () {
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


	describe('/GET/helm/list helm', function () {
		it('it should list releases for admin', (done) => {
			chai.request(server)
				.get('/api/v1/helm/list')
				.set('x-access-token', fakeUser.admin.token)
				.set('x-key', fakeUser.admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});

		it('it should not list releases for client', (done) => {
			chai.request(server)
				.get('/api/v1/helm/list')
				.set('x-access-token', fakeUser.client.token)
				.set('x-key', fakeUser.client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});
        
		it('it should list releases for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/helm/list')
				.set('x-access-token', fakeUser.moderator.token)
				.set('x-key', fakeUser.moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
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
