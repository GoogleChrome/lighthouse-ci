/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI healthcheck CLI', () => {
  const autorunFixtureDir = path.join(__dirname, 'fixtures/autorun-static-dir');
  const rcFile = path.join(autorunFixtureDir, 'lighthouserc.json');

  describe('configuration', () => {
    it('should find an rc file with explicit path', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', `--config=${rcFile}`]);
      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Configuration file found
        ✅  Chrome installation found
        ⚠️   GitHub token not set
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should find an rc file with explicit relative path', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', `--config=../lighthouserc.js`], {
        cwd: autorunFixtureDir,
      });
      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Configuration file found
        ✅  Chrome installation found
        ⚠️   GitHub token not set
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should find an rc file by autodetect', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck'], {
        cwd: autorunFixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: undefined}, // override the clean test env
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Configuration file found
        ✅  Chrome installation found
        ⚠️   GitHub token not set
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should not find an rc file by autodetect recursively', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck'], {
        cwd: __dirname,
        env: {LHCI_NO_LIGHTHOUSERC: undefined}, // override the clean test env
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should opt-out of autodetect via env variable', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck'], {
        cwd: autorunFixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: '1'},
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should opt-out of autodetect via flag', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', '--no-lighthouserc'], {
        cwd: autorunFixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: undefined},
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });
  });

  describe('chrome installation', () => {
    let fixtureDir;

    beforeEach(() => {
      fixtureDir = path.join(os.tmpdir(), fs.mkdtempSync('lhcihealthcheck'));
      fs.mkdirSync(fixtureDir, {recursive: true});
    });

    afterEach(() => {
      rimraf.sync(fixtureDir);
    });

    it('should find a chrome installation installed on the system', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', '--fatal'], {
        cwd: fixtureDir,
      });

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should not find a chrome installation when ignored', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', '--fatal'], {
        cwd: fixtureDir,
        env: {LHCITEST_IGNORE_CHROME_INSTALLATIONS: '1'},
      });

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ❌  Chrome installation not found
        Healthcheck failed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(1);
    });

    it('should find a chrome installation when ignored but passed explicitly via config', () => {
      const ci = {collect: {chromePath: fixtureDir}};
      fs.writeFileSync(path.join(fixtureDir, '.lighthouserc.json'), JSON.stringify({ci}));

      const {stdout, stderr, status} = runCLI(['healthcheck', '--fatal'], {
        cwd: fixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: undefined, LHCITEST_IGNORE_CHROME_INSTALLATIONS: '1'},
      });

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Configuration file found
        ✅  Chrome installation found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });
  });
});
