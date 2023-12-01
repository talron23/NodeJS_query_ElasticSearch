const expect = require('chai');
const request = require('supertest'); // Supertest for HTTP assertions
const app = require('../app.js');

describe('GET /top-source-ips', () => {
  it('responds with JSON', (done) => {
    request(app)
      .get('/top-source-ips')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('contains sourceIPs array in the response', (done) => {
    request(app)
      .get('/top-source-ips')
      .end((err, res) => {
        // Check if the response body is an array
        expect(res.body).to.be.an('array');
        // Check the first element in the array for 'aggregations' and 'top_source_ips'
        res.body.forEach((item) => {
          expect(item).to.have.property('sourceIPAddress');
          expect(item).to.have.property('count');
        });

        done();
      });
  }).timeout(5000);
});