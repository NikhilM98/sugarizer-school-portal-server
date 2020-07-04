// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
var server = require('../../index.js');
var chai = require('chai');
var chaiHttp = require('chai-http');

//init server
chai.use(chaiHttp);
chai.should();

describe('Waiting for the server to start', function () {
	before(function (done) {
		setTimeout(function () {
			done();
		}, 10000);
	});

	describe('/GET api', function () {
		it('it should get api metadata', (done) => {
			chai.request(server)
				.get('/api')
				.end((err, res) => {
					res.should.have.status(200);
					done();
				});
		});
	}); 
});
