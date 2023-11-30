const { expect } = require('chai');
const request = require('supertest'); // Supertest for HTTP assertions
const { server, esClient } = require('../app.js');

describe('GET /top-source-ips', () => {
  it('responds with JSON', (done) => {
    request(server)
      .get('/top-source-ips')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('contains sourceIPs array in the response', (done) => {
    request(server)
      .get('/top-source-ips')
      .end((err, res) => {
        expect(res.body).to.have.property('sourceIPs').that.is.an('array');
        done();
      });
  });
});