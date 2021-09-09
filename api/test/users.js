// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
var server = require('../../index.js');
var chai = require('chai');
var chaiHttp = require('chai-http');
var timestamp = +new Date();
var otplib = require('otplib');

//init server
chai.use(chaiHttp);
chai.should();

//fake user
var fakeUser = {
	'master_admin': '{"name":"Fake Master Admin ' + (timestamp.toString()) + '","username":"fake_master_admin_' + (timestamp.toString()) + '","password":"sugarizer","language":"hi","role":"admin"}',
	'admin1': '{"name":"Fake Admin 1 ' + (timestamp.toString()) + '","username":"fake_admin_1_' + (timestamp.toString()) + '","password":"sugarizer","language":"en","role":"admin"}',
	'admin2': '{"name":"Fake Admin 2 ' + (timestamp.toString()) + '","username":"fake_admin_2_' + (timestamp.toString()) + '","password":"sugarizer","language":"en","role":"admin"}',
	'master_client': '{"name":"Fake Master Client ' + (timestamp.toString()) + '","email":"fake_master_client_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"hi","role":"client"}',
	'client1': '{"name":"Fake Client 1 ' + (timestamp.toString()) + '","email":"fake_client_1_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"es","role":"client"}',
	'client2': '{"name":"Fake Client 2 ' + (timestamp.toString()) + '","email":"fake_client_2_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"es","role":"client"}',
	'master_moderator': '{"name":"Fake Master Moderator ' + (timestamp.toString()) + '","username":"fake_master_moderator_' + (timestamp.toString()) + '","password":"sugarizer","language":"hi","role":"moderator"}',
	'moderator1': '{"name":"Fake Moderator 1 ' + (timestamp.toString()) + '","username":"fake_moderator_1_' + (timestamp.toString()) + '","password":"sugarizer","language":"fr","role":"moderator"}',
	'moderator2': '{"name":"Fake Moderator 2 ' + (timestamp.toString()) + '","username":"fake_moderator_2_' + (timestamp.toString()) + '","password":"sugarizer","language":"fr","role":"moderator"}',
	'tfa_user': '{"name":"tfa user ' + (timestamp.toString()) + '","username":"tfa_user_' + (timestamp.toString()) + '","password":"sugarizer","language":"hi","role":"admin", "uniqueSecret":"AAAAAAAAAAAAAAA"}'
};

describe('Users', function () {
	// create & login user and store access key
	before((done) => {
		// delay for db connection for establish
		setTimeout(function () {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.master_admin
				})
				.end(() => {
					//login user
					chai.request(server)
						.post('/auth/login')
						.send({
							"user": fakeUser.master_admin
						})
						.end((err, res) => {
							//store user data
							fakeUser.master_admin = res.body.token;
							chai.request(server)
								.post('/auth/signup')
								.send({
									"user": fakeUser.master_client
								})
								.end(() => {
									//login user
									chai.request(server)
										.post('/auth/login')
										.send({
											"user": fakeUser.master_client
										})
										.end((err, res) => {
											//store user data
											fakeUser.master_client = res.body.token;
											chai.request(server)
												.post('/auth/signup')
												.send({
													"user": fakeUser.master_moderator
												})
												.end(() => {
													//login user
													chai.request(server)
														.post('/auth/login')
														.send({
															"user": fakeUser.master_moderator
														})
														.end((err, res) => {
															//store user data
															fakeUser.master_moderator = res.body.token;
															chai.request(server)
																.post('/auth/signup')
																.send({
																	"user": fakeUser.tfa_user
																})
																.end(() => {
																	chai.request(server)
																		.post('/auth/login')
																		.send({
																			"user": fakeUser.tfa_user
																		})
																		.end((err, res) => {
																			fakeUser.tfa_user = res.body.token;
																			done();
																		});
																});
														});
												});
										});
								});
						});
				}, 500);
		});
	});

	describe('/POST users', () => {
		it('it should add an admin user by another admin', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": fakeUser.admin1
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.admin1 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Admin 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_admin_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("en");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should not add admin user by client', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.send({
					"user": fakeUser.admin2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not add admin user by moderator', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.send({
					"user": fakeUser.admin2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should add a client user by admin', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": fakeUser.client1
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.client1 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Client 1 " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_client_1_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("es");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should not add a client user by another client', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.send({
					"user": fakeUser.client2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not add a client user by moderator', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.send({
					"user": fakeUser.client2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should add a moderator user by admin', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": fakeUser.moderator1
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.moderator1 = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Moderator 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_moderator_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('moderator');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should not add a moderator user by client', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.send({
					"user": fakeUser.moderator2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not add a moderator user by another moderator', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.send({
					"user": fakeUser.moderator2
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not add duplicate admin user', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": JSON.stringify(fakeUser.admin1)
				})
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});

		it('it should not add duplicate client user', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": JSON.stringify(fakeUser.client1)
				})
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});

		it('it should not add duplicate moderator user', (done) => {
			chai.request(server)
				.post('/api/v1/users/')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					"user": JSON.stringify(fakeUser.moderator1)
				})
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});

	describe('/GET users', () => {
		it('it should return all the users for admin', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					role: "all"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.should.be.an('array');
					res.body.users.length.should.be.above(0);
					done();
				});
		});

		it('it should return noting for clients', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.query({
					role: "all"
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should return all the users for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.query({
					role: "all"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.should.be.an('array');
					res.body.users.length.should.be.above(0);
					done();
				});
		});

		it('it should return all the admins', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					role: "admin"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.should.be.an('array');
					res.body.users.length.should.be.above(0);
					for (var i = 0; i < res.body.users.length; i++) {
						res.body.users[i].should.be.an('object');
						res.body.users[i].should.have.property('_id').not.eql(undefined);
						res.body.users[i].should.have.property('name').not.eql(undefined);
						res.body.users[i].should.have.property('username').not.eql(undefined);
						res.body.users[i].should.have.property('role').eql('admin');
					}
					done();
				});
		});

		it('it should return all the clients', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					role: "client"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.should.be.an('array');
					res.body.users.length.should.be.above(0);
					for (var i = 0; i < res.body.users.length; i++) {
						res.body.users[i].should.be.an('object');
						res.body.users[i].should.have.property('_id').not.eql(undefined);
						res.body.users[i].should.have.property('name').not.eql(undefined);
						res.body.users[i].should.have.property('email').not.eql(undefined);
						res.body.users[i].should.have.property('role').eql('client');
					}
					done();
				});
		});

		it('it should return all the moderators', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					role: "moderator"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.should.be.an('array');
					res.body.users.length.should.be.above(0);
					for (var i = 0; i < res.body.users.length; i++) {
						res.body.users[i].should.be.an('object');
						res.body.users[i].should.have.property('_id').not.eql(undefined);
						res.body.users[i].should.have.property('name').not.eql(undefined);
						res.body.users[i].should.have.property('username').not.eql(undefined);
						res.body.users[i].should.have.property('role').eql('moderator');
					}
					done();
				});
		});

		it('it should return all matched users with partial search', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					q: "fake"
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.length.should.be.gte(1);
					done();
				});
		});

		it('it should return all users after a timestamp', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					stime: fakeUser.master_admin.timestamp
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.length.should.be.gte(1);
					done();
				});
		});

		it('it should not return users for a future timestamp', (done) => {
			chai.request(server)
				.get('/api/v1/users')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.query({
					stime: 1 + fakeUser.master_admin.timestamp
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.users.length.should.be.eql(0);
					done();
				});
		});
	});

	describe('/GET/:id users', () => {
		it('it should return nothing on invalid id', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + 'xxx')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(8);
					done();
				});
		});

		it('it should return nothing on inexisting id', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.eql({});
					done();
				});
		});

		it('it should return right client by id for admin', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.client1._id);
					res.body.should.have.property('name').eql("Fake Client 1 " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_client_1_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("es");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should not return right client by id for unauthorized client', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should return right client by id for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.client1._id);
					res.body.should.have.property('name').eql("Fake Client 1 " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_client_1_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("es");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should return right admin by id for admin', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.admin1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.admin1._id);
					res.body.should.have.property('name').eql("Fake Admin 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_admin_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("en");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should not return right admin by id for unauthorized client', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.admin1._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should return right admin by id for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.admin1._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.admin1._id);
					res.body.should.have.property('name').eql("Fake Admin 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_admin_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("en");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should return right moderator by id for admin', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.moderator1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.moderator1._id);
					res.body.should.have.property('name').eql("Fake Moderator 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_moderator_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('moderator');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should not return right moderator by id for unauthorized client', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.moderator1._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should return right moderator by id for moderator', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.moderator1._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.moderator1._id);
					res.body.should.have.property('name').eql("Fake Moderator 1 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_moderator_1_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('moderator');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should return client by id for client himself', (done) => {
			chai.request(server)
				.get('/api/v1/users/' + fakeUser.master_client.user._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.master_client.user._id);
					res.body.should.have.property('name').eql("Fake Master Client " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_master_client_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("hi");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});
	});

	describe('/PUT/:id users', () => {
		it('it should do nothing on invalid user', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + 'xxx')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					user: '{"language":"en"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(8);
					done();
				});
		});

		it('it should do nothing on inexisting user', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					user: '{"language":"en"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(8);
					done();
				});
		});

		it('it should update the valid user by admin', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					user: '{"language":"hi"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.client1._id);
					res.body.should.have.property('name').eql("Fake Client 1 " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_client_1_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("hi");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should do nothing by the unauthorized client', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.send({
					user: '{"language":"fr"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should update the valid user by the authorized client', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.master_client.user._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.send({
					user: '{"language":"fr"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.master_client.user._id);
					res.body.should.have.property('name').eql("Fake Master Client " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_master_client_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should do nothing by the unauthorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.send({
					user: '{"language":"fr"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should update the valid user by the authorized moderator', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.master_moderator.user._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.send({
					user: '{"language":"fr"}'
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.master_moderator.user._id);
					res.body.should.have.property('name').eql("Fake Master Moderator " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_master_moderator_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('moderator');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should not update the user with duplicate username', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.moderator1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					user: '{"username":"fake_master_moderator_' + timestamp.toString() + '"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(10);
					done();
				});
		});

		it('it should not update the user with duplicate email', (done) => {
			chai.request(server)
				.put('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.send({
					user: '{"email":"fake_master_client_' + (timestamp.toString()) + '@mail.com"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(10);
					done();
				});
		});
	});

	describe('/DELETE/:id users', () => {
		it('it should do nothing on invalid user', (done) => {
			chai.request(server)
				.delete('/api/v1/users/' + 'xxx')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(8);
					done();
				});
		});

		it('it should not remove an inexisting user', (done) => {
			chai.request(server)
				.delete('/api/v1/users/' + 'ffffffffffffffffffffffff')
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(8);
					done();
				});
		});

		it('it should not remove a user by the client', (done) => {
			chai.request(server)
				.delete('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_client.token)
				.set('x-key', fakeUser.master_client.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should not remove a user by the moderator', (done) => {
			chai.request(server)
				.delete('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_moderator.token)
				.set('x-key', fakeUser.master_moderator.user._id)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(9);
					done();
				});
		});

		it('it should remove the valid user by the admin', (done) => {
			chai.request(server)
				.delete('/api/v1/users/' + fakeUser.client1._id)
				.set('x-access-token', fakeUser.master_admin.token)
				.set('x-key', fakeUser.master_admin.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	});

	describe('/PUT Enable/Disable 2FA', () => {
		it('it should enable 2 Factor Authentication for the user', (done) => {
			chai.request(server)
				.put('/api/v1/profile/enable2FA')
				.set('x-access-token', fakeUser.tfa_user.token)
				.set('x-key', fakeUser.tfa_user.user._id)
				.send({
					userToken: otplib.authenticator.generate("AAAAAAAAAAAAAAA")
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.tfa_user.user._id);
					res.body.should.have.property('tfa').eql(true);
					done();
				});
		});

		it('it should disable 2 Factor Authentication for the user', (done) => {
			chai.request(server)
				.put('/api/v1/profile/disable2FA')
				.set('x-access-token', fakeUser.tfa_user.token)
				.set('x-key', fakeUser.tfa_user.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').eql(fakeUser.tfa_user.user._id);
					res.body.should.not.have.property('uniqueSecret');
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

	});

	describe('/GET 2 Factor Authentication', () => {
		it('it should update uniqueSecret for user', (done) => {
			chai.request(server)
				.get('/api/v1/profile/enable2FA')
				.set('x-access-token', fakeUser.tfa_user.token)
				.set('x-key', fakeUser.tfa_user.user._id)
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.tfa_user = res.body.user;
					res.body.should.be.an('object');
					res.body.user.should.have.property('_id').eql(fakeUser.tfa_user._id);
					res.body.user.should.have.property('name').eql("tfa user " + (timestamp.toString()));
					res.body.user.should.have.property('role').eql('admin');
					res.body.user.should.have.property('created_time').not.eql(undefined);
					res.body.user.should.have.property('timestamp').not.eql(undefined);
					res.body.user.should.have.property('tfa').eql(false);
					res.body.uniqueSecret.should.not.eql(undefined);
					res.body.otpAuth.should.not.eql(undefined);
					done();
				});
		});

	});

	// delete fake user access key
	after((done) => {
		chai.request(server)
			.delete('/api/v1/users/' + fakeUser.admin1._id)
			.set('x-access-token', fakeUser.master_admin.token)
			.set('x-key', fakeUser.master_admin.user._id)
			.end((err, res) => {
				res.should.have.status(200);
				chai.request(server)
					.delete('/api/v1/users/' + fakeUser.master_client.user._id)
					.set('x-access-token', fakeUser.master_admin.token)
					.set('x-key', fakeUser.master_admin.user._id)
					.end((err, res) => {
						res.should.have.status(200);
						chai.request(server)
							.delete('/api/v1/users/' + fakeUser.master_moderator.user._id)
							.set('x-access-token', fakeUser.master_admin.token)
							.set('x-key', fakeUser.master_admin.user._id)
							.end((err, res) => {
								res.should.have.status(200);
								chai.request(server)
									.delete('/api/v1/users/' + fakeUser.moderator1._id)
									.set('x-access-token', fakeUser.master_admin.token)
									.set('x-key', fakeUser.master_admin.user._id)
									.end((err, res) => {
										res.should.have.status(200);
										chai.request(server)
											.delete('/api/v1/users/' + fakeUser.master_admin.user._id)
											.set('x-access-token', fakeUser.master_admin.token)
											.set('x-key', fakeUser.master_admin.user._id)
											.end((err, res) => {
												res.should.have.status(200);
												done();
											});
									});
							});
					});
			});
	});
});
