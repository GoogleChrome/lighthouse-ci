/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI healthcheck CLI', () => {
  const fixtureDir = path.join(__dirname, 'fixtures');
  const rcFile = path.join(fixtureDir, 'lighthouserc.json');

  describe('configuration', () => {
    it('should find an rc file with explicit path', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', `--config=${rcFile}`]);
      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Ancestor hash determinable
        ✅  Configuration file found
        ⚠️   GitHub token set
        ✅  LHCI server reachable
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should find an rc file by autodetect', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck'], {
        cwd: fixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: undefined}, // override the clean test env
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Ancestor hash determinable
        ✅  Configuration file found
        ⚠️   GitHub token set
        ✅  LHCI server reachable
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
        ✅  Ancestor hash determinable
        ⚠️   Configuration file found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should opt-out of autodetect via env variable', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck'], {
        cwd: fixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: '1'},
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Ancestor hash determinable
        ⚠️   Configuration file found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });

    it('should opt-out of autodetect via flag', () => {
      const {stdout, stderr, status} = runCLI(['healthcheck', '--no-lighthouserc'], {
        cwd: fixtureDir,
        env: {LHCI_NO_LIGHTHOUSERC: undefined},
      });

      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Ancestor hash determinable
        ⚠️   Configuration file found
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });
  });
});
