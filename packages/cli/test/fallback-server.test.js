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
    expect(body).toEqual(
      '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <title>index test page for staticDistDir usage</title>\n  </head>\n  <body>\n    test\n  </body>\n</html>\n'
    );
  });

  it('should "/"  request result with isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, true);
    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}`}, (error, response, body) => {
        resolve(body);
      });
    });
    expect(body).toEqual(
      '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <title>index test page for staticDistDir usage</title>\n  </head>\n  <body>\n    test\n  </body>\n</html>\n'
    );
  });

  it('should "/japan" request result without isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, false);

    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}/japan`}, (error, response, body) => {
        resolve(body);
      });
    });

    expect(body).toEqual(
      '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot GET /japan</pre>\n</body>\n</html>\n'
    );
  });

  it('should "/japan"  request result with isSinglePageApplication', async () => {
    const server = await startFallbackServer(fixturesDir, true);
    const body = await new Promise(resolve => {
      request({url: `http://localhost:${server.port}/japan`}, (error, response, body) => {
        resolve(body);
      });
    });
    expect(body).toEqual(
      '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <title>index test page for staticDistDir usage</title>\n  </head>\n  <body>\n    test\n  </body>\n</html>\n'
    );
  });
});
