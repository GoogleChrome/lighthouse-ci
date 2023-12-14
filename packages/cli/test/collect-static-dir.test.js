/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

jest.retryTimes(3);

/* eslint-env jest */

const path = require('path');
const {runCLI} = require('./test-utils.js');

jest.setTimeout(60_000);

describe('Lighthouse CI collect CLI', () => {
  describe('with URLs', () => {
    const staticDistDir = path.join(__dirname, 'fixtures/collect-static-dir-with-urls');
    it('should collect a static dir with explicit URLs', async () => {
      const {stdout, stderr, status} = await runCLI(
        ['collect', '-n=1', '--staticDistDir=./', '--url=/child/grandchild.html'],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
        "Started a web server on port XXXX...
        Running Lighthouse 1 time(s) on http://localhost:XXXX/child/grandchild.html
        Run #1...done.
        Done running Lighthouse!
        "
        `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should respect nested environment variables', async () => {
      const {stdout, stderr, status} = await runCLI(
        ['collect', '--staticDistDir=./', '--url=/child/grandchild.html'],
        {
          useMockLhr: true,
          cwd: staticDistDir,
          env: {LHCI_COLLECT__NUMBER_OF_RUNS: '2'},
        }
      );

      expect(stdout).toMatchInlineSnapshot(`
        "Started a web server on port XXXX...
        Running Lighthouse 2 time(s) on http://localhost:XXXX/child/grandchild.html
        Run #1...done.
        Run #2...done.
        Done running Lighthouse!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });
  });

  describe('with autodiscover limit', () => {
    const staticDistDir = path.join(__dirname, 'fixtures/collect-static-dir-autodiscover-limit');
    it('should collect a single page from static dir', async () => {
      const {stdout, stderr, status} = await runCLI(
        ['collect', '-n=1', '--staticDistDir=./', '--maxAutodiscoverUrls=1'],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/board.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should collect all available pages from static dir', async () => {
      const {stdout, stderr, status} = await runCLI(
        ['collect', '-n=1', '--staticDistDir=./', '--maxAutodiscoverUrls=0'],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/board.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/checkout.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/index.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/jobs.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/shop.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/team.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });
  });

  describe('with autodiscoverUrlBlocklist', () => {
    const staticDistDir = path.join(__dirname, 'fixtures/collect-static-dir-autodiscover-limit');
    it('should not filter any files because it was not tested', async () => {
      const {stdout, stderr, status} = await runCLI(
        [
          'collect',
          '-n=1',
          '--staticDistDir=./',
          '--maxAutodiscoverUrls=1',
          '--autodiscoverUrlBlocklist=/team.html',
        ],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/board.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should filter index file', async () => {
      const {stdout, stderr, status} = await runCLI(
        ['collect', '-n=1', '--staticDistDir=./', '--autodiscoverUrlBlocklist=/index.html'],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/board.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/checkout.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/jobs.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/shop.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/team.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should filter index file and board file', async () => {
      const {stdout, stderr, status} = await runCLI(
        [
          'collect',
          '-n=1',
          '--staticDistDir=./',
          '--autodiscoverUrlBlocklist=/index.html',
          '--autodiscoverUrlBlocklist=/board.html',
        ],
        {
          useMockLhr: true,
          cwd: staticDistDir,
        }
      );
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/checkout.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/jobs.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/shop.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/team.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });
  });

  describe('by default', () => {
    const staticDistDir = path.join(__dirname, 'fixtures/collect-static-dir-autodiscover-limit');

    it('should collect 5 pages from static dir', async () => {
      const {stdout, stderr, status} = await runCLI(['collect', '-n=1', '--staticDistDir=./'], {
        useMockLhr: true,
        cwd: staticDistDir,
      });
      expect(stdout).toMatchInlineSnapshot(`
          "Started a web server on port XXXX...
          Running Lighthouse 1 time(s) on http://localhost:XXXX/board.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/checkout.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/index.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/jobs.html
          Run #1...done.
          Running Lighthouse 1 time(s) on http://localhost:XXXX/shop.html
          Run #1...done.
          Done running Lighthouse!
          "
          `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });
  });
});
