// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
var server = require('../../index.js');
var chai = require('chai');
var chaiHttp = require('chai-http');
var timestamp = +new Date();
var otplib = require('otplib');

//fake user for testing auth
var fakeUser = {
	'admin': '{"name":"Fake Admin ' + (timestamp.toString()) + '","username":"fake_admin_' + (timestamp.toString()) + '","password":"sugarizer","language":"en","role":"admin"}',
	'client': '{"name":"Fake Client ' + (timestamp.toString()) + '","email":"fake_client_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"es","role":"client"}',
	'moderator': '{"name":"Fake Moderator ' + (timestamp.toString()) + '","username":"fake_moderator_' + (timestamp.toString()) + '","password":"sugarizer","language":"fr","role":"moderator"}',
	'missing_role': '{"name":"Fake Missing Role ' + (timestamp.toString()) + '","email":"fake_missing_role_' + (timestamp.toString()) + '@mail.com","password":"sugarizer","language":"hi"}',
	'tfa_user': '{"name":"tfa user ' + (timestamp.toString()) + '","username":"tfa_user_' + (timestamp.toString()) + '","password":"sugarizer","language":"hi","role":"admin", "uniqueSecret":"AAAAAAAAAAAAAAA", "tfa":true}',
	'tfa_user2': '{"name":"tfa user2 ' + (timestamp.toString()) + '","username":"tfa_user_2_' + (timestamp.toString()) + '","password":"sugarizer","language":"hi","role":"admin", "uniqueSecret":"AAAAAAAAAAAAAAA", "tfa":true}'
};

//init server
chai.use(chaiHttp);
chai.should();

describe('Auth', function () {
	before(function (done) {
		// delay for db connection for establish
		setTimeout(function () {
			done();
		}, 300);
	});

	describe('/POST signup', () => {
		it('it should add an admin user from the localhost', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.admin
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Admin " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_admin_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("en");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should add a client user', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.client
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Client " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_client_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("es");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should add a moderator user from the localhost', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.moderator
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Moderator " + (timestamp.toString()));
					res.body.should.have.property('username').eql("fake_moderator_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('moderator');
					res.body.should.have.property('language').eql("fr");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);
					done();
				});
		});

		it('it should add a client user for the user with missing role', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.missing_role
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.missing_role = res.body;
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("Fake Missing Role " + (timestamp.toString()));
					res.body.should.have.property('email').eql("fake_missing_role_" + (timestamp.toString()) + "@mail.com");
					res.body.should.have.property('role').eql('client');
					res.body.should.have.property('language').eql("hi");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(false);	
					done();
				});
		});

		it('it should add a 2 Factor user', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.tfa_user
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("tfa user " + (timestamp.toString()));
					res.body.should.have.property('username').eql("tfa_user_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("hi");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(true);
					done();
				});
		});

		it('it should add a 2 Factor user2', (done) => {
			chai.request(server)
				.post('/auth/signup')
				.send({
					"user": fakeUser.tfa_user2
				})
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('_id').not.eql(undefined);
					res.body.should.have.property('name').eql("tfa user2 " + (timestamp.toString()));
					res.body.should.have.property('username').eql("tfa_user_2_" + (timestamp.toString()));
					res.body.should.have.property('role').eql('admin');
					res.body.should.have.property('language').eql("hi");
					res.body.should.have.property('created_time').not.eql(undefined);
					res.body.should.have.property('timestamp').not.eql(undefined);
					res.body.should.have.property('tfa').eql(true);
					done();
				});
		});
	});


	describe('/POST login', () => {
		it('it should not log in with wrong email', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					user: '{"email":"fake_wrong_client_' + (timestamp.toString()) + '@mail.com","password":"sugarizer"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});

		it('it should not log in with wrong username', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					user: '{"username":"fake_wrong_admin_' + timestamp.toString() + '","password":"sugarizer"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});

		it('it should not log in with right email but wrong password', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					user: '{"email":"fake_client_' + (timestamp.toString()) + '@mail.com","password":"sugarizer1"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});

		it('it should not log in with right username but wrong password', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					user: '{"username":"fake_admin_' + timestamp.toString() + '","password":"sugarizer1"}'
				})
				.end((err, res) => {
					res.should.have.status(401);
					res.body.code.should.be.eql(1);
					done();
				});
		});

		it('it should log into an admin user', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					"user": fakeUser.admin
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.admin = res.body.token;
					res.body.token.should.be.an('object');
					res.body.token.should.have.property('token').not.eql(undefined);
					res.body.token.should.have.property('expires').not.eql(undefined);
					res.body.token.user.should.be.an('object');
					res.body.token.user.should.have.property('_id').not.eql(undefined);
					res.body.token.user.should.have.property('name').eql("Fake Admin " + (timestamp.toString()));
					res.body.token.user.should.have.property('username').eql("fake_admin_" + (timestamp.toString()));
					res.body.token.user.should.have.property('role').eql('admin');
					res.body.token.user.should.have.property('language').eql("en");
					res.body.token.user.should.have.property('created_time').not.eql(undefined);
					res.body.token.user.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should log into a client user', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					"user": fakeUser.client
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.client = res.body.token;
					res.body.token.should.be.an('object');
					res.body.token.should.have.property('token').not.eql(undefined);
					res.body.token.should.have.property('expires').not.eql(undefined);
					res.body.token.user.should.be.an('object');
					res.body.token.user.should.have.property('_id').not.eql(undefined);
					res.body.token.user.should.have.property('name').eql("Fake Client " + (timestamp.toString()));
					res.body.token.user.should.have.property('email').eql("fake_client_" + (timestamp.toString()) + "@mail.com");
					res.body.token.user.should.have.property('role').eql('client');
					res.body.token.user.should.have.property('language').eql("es");
					res.body.token.user.should.have.property('created_time').not.eql(undefined);
					res.body.token.user.should.have.property('timestamp').not.eql(undefined);
					done();
				});
		});

		it('it should log into a moderator user', (done) => {
			chai.request(server)
				.post('/auth/login')
				.send({
					"user": fakeUser.moderator
				})
				.end((err, res) => {
					res.should.have.status(200);
					fakeUser.moderator = res.body.token;
					res.body.token.should.be.an('object');
					res.body.token.should.have.property('token').not.eql(undefined);
					res.body.token.should.have.property('expires').not.eql(undefined);
					res.body.token.user.should.be.an('object');
					res.body.token.user.should.have.property('_id').not.eql(undefined);
					res.body.token.user.should.have.property('name').eql("Fake Moderator " + (timestamp.toString()));
					res.body.token.user.should.have.property('username').eql("fake_moderator_" + (timestamp.toString()));
					res.body.token.user.should.have.property('role').eql('moderator');
					res.body.token.user.should.have.property('language').eql("fr");
					res.body.token.user.should.have.property('created_time').not.eql(undefined);
					res.body.token.user.should.have.property('timestamp').not.eql(undefined);
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
							.delete('/api/v1/users/' + fakeUser.missing_role._id)
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
});
