/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');
const FallbackServer = require('../src/collect/fallback-server.js');
const {startFallbackServer} = require('./test-utils.js');
const fetch = require('isomorphic-fetch');

describe('fallbackServer', () => {
  let server;
  const fixturesDir = path.join(__dirname, 'fixtures', 'collect-static-dir-without-urls');

  const fetchBody = async url => (await fetch(`http://localhost:${server.port}${url}`)).text();

  describe('without isSinglePageApplication', () => {
    beforeAll(async () => {
      server = await startFallbackServer(fixturesDir, {isSinglePageApplication: false});
    });

    afterAll(async () => {
      await server.close();
    });

    it('should fetch /', async () => {
      const body = await fetchBody('/');
      expect(body).toContain('index test page');
    });

    it('should fetch /checkout.html', async () => {
      const body = await fetchBody('/checkout.html');
      expect(body).toContain('checkout test page');
    });

    it('should fetch a 404 route', async () => {
      const body = await fetchBody('/missing');
      expect(body).toContain('Cannot GET /missing');
    });
  });

  describe('with isSinglePageApplication', () => {
    beforeAll(async () => {
      server = await startFallbackServer(fixturesDir, {isSinglePageApplication: true});
    });

    afterAll(async () => {
      await server.close();
    });

    it('should fetch /', async () => {
      const body = await fetchBody('/');
      expect(body).toContain('index test page');
    });

    it('should fetch /checkout.html', async () => {
      const body = await fetchBody('/checkout.html');
      expect(body).toContain('checkout test page');
    });

    it('should serve index for a 404', async () => {
      const body = await fetchBody('/missing');
      expect(body).toContain('index test page');
    });
  });

  describe('#readHtmlFilesInDirectory()', () => {
    let tmpDir = '';

    beforeAll(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lhci-fallback'));
      fs.writeFileSync(`${tmpDir}/index.html`, '');
      fs.writeFileSync(`${tmpDir}/404.html`, '');
      fs.mkdirSync(`${tmpDir}/checkout`);
      fs.writeFileSync(`${tmpDir}/checkout/index.html`, '');
      fs.mkdirSync(`${tmpDir}/pricing`);
      fs.writeFileSync(`${tmpDir}/pricing/index.html`, '');
      fs.mkdirSync(`${tmpDir}/pricing/plans`);
      fs.writeFileSync(`${tmpDir}/pricing/plans/index.html`, '');
      // These should be ignored
      fs.mkdirSync(`${tmpDir}/node_modules`);
      fs.writeFileSync(`${tmpDir}/node_modules/index.html`, '');
      fs.mkdirSync(`${tmpDir}/.lighthouseci`);
      fs.writeFileSync(`${tmpDir}/.lighthouseci/index.html`, '');
    });

    it('should find all HTML files', () => {
      expect(FallbackServer.readHtmlFilesInDirectory(tmpDir, 2)).toEqual([
        {file: '404.html', depth: 0},
        {file: 'index.html', depth: 0},
        {file: 'checkout/index.html', depth: 1},
        {file: 'pricing/index.html', depth: 1},
        {file: 'pricing/plans/index.html', depth: 2},
      ]);
    });

    it('should only traverse depth', () => {
      expect(FallbackServer.readHtmlFilesInDirectory(tmpDir, 1)).toEqual([
        {file: '404.html', depth: 0},
        {file: 'index.html', depth: 0},
        {file: 'checkout/index.html', depth: 1},
        {file: 'pricing/index.html', depth: 1},
      ]);
    });
  });
});
