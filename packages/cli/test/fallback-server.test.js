'use strict';
/* eslint-env jest */
const path = require('path');
const {startFallbackServer} = require('./test-utils.js');
const request = require('request');

describe('fallbackServer', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  it('should "/" request result without isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, false);
    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}`}, (error, response, body) => {
        resolve(body);
      });
    });
    expect(body.includes('index test page for staticDistDir usage')).toEqual(true);
  });

  it('should "/"  request result with isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, true);
    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}`}, (error, response, body) => {
        resolve(body);
      });
    });
    expect(body.includes('index test page for staticDistDir usage')).toEqual(true);
  });

  it('should "/japan" request result without isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, false);

    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}/japan`}, (error, response, body) => {
        resolve(body);
      });
    });

    expect(body.includes('Cannot GET /japan')).toEqual(true);
  });

  it('should "/japan"  request result with isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, true);
    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}/japan`}, (error, response, body) => {
        resolve(body);
      });
    });
    expect(body.includes('index test page for staticDistDir usage')).toEqual(true);
  });
});
