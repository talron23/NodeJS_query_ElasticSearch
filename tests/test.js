const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../app.js');

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
        if (res.body.length > 0) {
          res.body.forEach((item) => {
            expect(item).to.have.property('sourceIBAddress');
            expect(item).to.have.property('count');
          });
        } else {
          // Fail the test explicitly if the array is empty
          expect.fail('Expected non-empty array, but received an empty array.');
        }

        done();
      });
  })
});