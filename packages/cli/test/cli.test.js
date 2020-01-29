/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

jest.retryTimes(3);

const path = require('path');
const os = require('os');
const fs = require('fs');
const {spawn} = require('child_process');
const fetch = require('isomorphic-fetch');
const log = require('lighthouse-logger');
const puppeteer = require('puppeteer');
const {
  startServer,
  cleanStdOutput,
  waitForCondition,
  getSqlFilePath,
  safeDeleteFile,
  runCLI,
  CLI_PATH,
} = require('./test-utils.js');

describe('Lighthouse CI CLI', () => {
  const rcFile = path.join(__dirname, 'fixtures/lighthouserc.json');
  const rcMatrixFile = path.join(__dirname, 'fixtures/lighthouserc-matrix.json');
  const rcExtendedFile = path.join(__dirname, 'fixtures/lighthouserc-extended.json');
  const budgetsFile = path.join(__dirname, 'fixtures/budgets.json');
  const tmpSqlFilePath = getSqlFilePath();

  let server;
  let projectToken;
  let urlToCollect;

  afterAll(async () => {
    if (server) {
      server.process.kill();
      await safeDeleteFile(server.sqlFile);
    }

    await safeDeleteFile(tmpSqlFilePath);
  });

  describe('server', () => {
    it('should bring up the server and accept requests', async () => {
      server = await startServer();
      urlToCollect = `http://localhost:${server.port}/app/`;
    });

    it('should accept requests', async () => {
      const response = await fetch(`http://localhost:${server.port}/v1/projects`);
      const projects = await response.json();
      expect(projects).toEqual([]);
    });
  });

  describe('wizard', () => {
    const ENTER_KEY = '\x0D';

    async function writeAllInputs(wizardProcess, inputs) {
      for (const input of inputs) {
        wizardProcess.stdin.write(input);
        wizardProcess.stdin.write(ENTER_KEY);
        // Wait for inquirer to write back our response, that's the signal we can continue.
        await waitForCondition(() => wizardProcess.stdoutMemory.includes(input));
        // Sometimes it still isn't ready though, give it a bit more time to process.
        await new Promise(r => setTimeout(r, process.env.CI ? 500 : 50));
      }

      wizardProcess.stdin.end();
    }

    it('should create a new project', async () => {
      const wizardProcess = spawn('node', [CLI_PATH, 'wizard']);
      wizardProcess.stdoutMemory = '';
      wizardProcess.stderrMemory = '';
      wizardProcess.stdout.on('data', chunk => (wizardProcess.stdoutMemory += chunk.toString()));
      wizardProcess.stderr.on('data', chunk => (wizardProcess.stderrMemory += chunk.toString()));

      await waitForCondition(() => wizardProcess.stdoutMemory.includes('Which wizard'));
      await writeAllInputs(wizardProcess, [
        '', // Just ENTER key to select "new-project"
        `http://localhost:${server.port}`, // The base URL to talk to
        'AwesomeCIProjectName', // Project name
        'https://example.com', // External build URL
      ]);

      expect(wizardProcess.stdoutMemory).toContain('Use token');
      expect(wizardProcess.stderrMemory).toEqual('');
      const tokenSentence = wizardProcess.stdoutMemory
        .match(/Use token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      projectToken = tokenSentence.match(/Use token ([\w-]+)/)[1];
    }, 30000);

    it('should create a new project with config file', async () => {
      const wizardProcess = spawn('node', [CLI_PATH, 'wizard', `--config=${rcFile}`]);
      wizardProcess.stdoutMemory = '';
      wizardProcess.stderrMemory = '';
      wizardProcess.stdout.on('data', chunk => (wizardProcess.stdoutMemory += chunk.toString()));
      wizardProcess.stderr.on('data', chunk => (wizardProcess.stderrMemory += chunk.toString()));

      await waitForCondition(() => wizardProcess.stdoutMemory.includes('Which wizard'));
      await writeAllInputs(wizardProcess, [
        '', // Just ENTER key to select "new-project"
        `http://localhost:${server.port}`, // The base URL to talk to
        'AwesomeCIProjectName', // Project name
        'https://example.com', // External build URL
      ]);

      expect(wizardProcess.stdoutMemory).toContain('Use token');
      expect(wizardProcess.stderrMemory).toEqual('');
      const tokenSentence = wizardProcess.stdoutMemory
        .match(/Use token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      projectToken = tokenSentence.match(/Use token ([\w-]+)/)[1];
      
      expect(wizardProcess.stdoutMemory).toContain('\"serverBaseUrl\":\"https://github.com/GoogleChrome/lighthouse-ci\"')
      expect(wizardProcess.stdoutMemory).toContain('\"extraHeaders\":\" {\\\"Authorization\\\": \\\"Basic bGlnaHRob3VzZTpjaQo=\\\"}\"}')

    }, 30000);
  });

  describe('healthcheck', () => {
    it('should pass when things are good', async () => {
      const LHCI_TOKEN = projectToken;
      const LHCI_SERVER_BASE_URL = `http://localhost:${server.port}`;
      const {stdout, stderr, status} = runCLI(['healthcheck', `--fatal`], {
        env: {LHCI_TOKEN, LHCI_SERVER_BASE_URL},
      });

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        ⚠️   GitHub token not set
        ✅  Ancestor hash determinable
        ✅  LHCI server reachable
        ✅  LHCI server token valid
        ✅  LHCI server unique build for this hash
        Healthcheck passed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    });

    it('should fail when things are bad', async () => {
      const LHCI_TOKEN = projectToken;
      const LHCI_SERVER_BASE_URL = `http://localhost:${server.port}`;
      const {stdout, stderr, status} = runCLI(
        ['healthcheck', `--config=${rcFile}`, `--fatal`, '--checks=githubToken'],
        {env: {LHCI_TOKEN, LHCI_SERVER_BASE_URL}}
      );

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ✅  Configuration file found
        ✅  Chrome installation found
        ❌  GitHub token not set
        ✅  Ancestor hash determinable
        ✅  LHCI server reachable
        ✅  LHCI server token valid
        ✅  LHCI server unique build for this hash
        Healthcheck failed!
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(1);
    });
  });

  // FIXME: Tests dependency. Moving these tests breaks others.
  describe('collect', () => {
    it('should collect results with a server command', () => {
      // FIXME: for some inexplicable reason this test cannot pass in Travis Windows
      if (os.platform() === 'win32') return;

      const startCommand = `yarn start server -p=14927 --storage.sqlDatabasePath=${tmpSqlFilePath}`;
      const {stdout, stderr, status} = runCLI([
        'collect',
        `-n=1`,
        `--config=${rcFile}`,
        `--start-server-command=${startCommand}`,
        `--url=http://localhost:14927/app/`,
      ]);

      const stdoutClean = stdout.replace(/sqlDatabasePath=.*?"/, 'sqlDatabasePath=<file>"');
      expect(stdoutClean).toMatchInlineSnapshot(`
        "Started a web server with \\"yarn start server -p=XXXX --storage.sqlDatabasePath=<file>\\"...
        Running Lighthouse 1 time(s) on http://localhost:XXXX/app/
        Run #1...done.
        Done running Lighthouse!
        "
      `);
      expect(stderr.toString()).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    }, 60000);
    it('should collect results from explicit urls', () => {
      const {stdout, stderr, status} = runCLI([
        'collect',
        `--config=${rcFile}`,
        `--url=${urlToCollect}`,
      ]);

      expect(stdout).toMatchInlineSnapshot(`
        "Running Lighthouse 2 time(s) on http://localhost:XXXX/app/
        Run #1...done.
        Run #2...done.
        Done running Lighthouse!
        "
      `);
      expect(stderr.toString()).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
    }, 60000);
  });

  describe('upload', () => {
    let uuids;
    it('should read LHRs from folders', () => {
      const {stdout, stderr, status, matches} = runCLI(
        ['upload', `--serverBaseUrl=http://localhost:${server.port}`],
        {env: {LHCI_TOKEN: projectToken}}
      );

      uuids = matches.uuids;
      expect(stdout).toMatchInlineSnapshot(`
        "Saving CI project AwesomeCIProjectName (<UUID>)
        Saving CI build (<UUID>)
        Saved LHR to http://localhost:XXXX (<UUID>)
        Saved LHR to http://localhost:XXXX (<UUID>)
        Done saving build results to Lighthouse CI
        View build diff at http://localhost:XXXX/app/projects/awesomeciprojectname/compare/<UUID>
        No GitHub token set, skipping.
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
      expect(uuids).toHaveLength(5);
    });

    it('should have written links to a file', () => {
      const linksFile = path.join(process.cwd(), '.lighthouseci/links.json');
      const links = fs.readFileSync(linksFile, 'utf8');
      expect(cleanStdOutput(links)).toMatchInlineSnapshot(`
        "{
          \\"http://localhost:XXXX/app/\\": \\"http://localhost:XXXX/app/projects/awesomeciprojectname/compare/<UUID>?compareUrl=http%3A%2F%2Flocalhost%3APORT%2Fapp%2F\\"
        }"
      `);
    });

    it('should have saved lhrs to the API', async () => {
      const [projectId, buildId, runAId, runBId] = uuids;
      const response = await fetch(
        `http://localhost:${server.port}/v1/projects/${projectId}/builds/${buildId}/runs`
      );

      const runs = await response.json();
      expect(runs.map(run => run.id)).toEqual([runBId, runAId]);
      expect(runs.map(run => run.url)).toEqual([
        'http://localhost:PORT/app/', // make sure we replaced the port
        'http://localhost:PORT/app/',
      ]);
      expect(runs.map(run => JSON.parse(run.lhr))).toMatchObject([
        {requestedUrl: urlToCollect},
        {requestedUrl: urlToCollect},
      ]);
    });

    it('should have sealed the build', async () => {
      const [projectId, buildId] = uuids;
      const response = await fetch(
        `http://localhost:${server.port}/v1/projects/${projectId}/builds/${buildId}`
      );

      const build = await response.json();
      expect(build).toMatchObject({lifecycle: 'sealed'});
    });

    it('should support target=temporary-public-storage', async () => {
      const {stdout, stderr, status} = runCLI(['upload', `--target=temporary-public-storage`]);

      expect(stdout).toContain('...success!');
      expect(stdout).toContain('Open the report at');
      expect(stderr).toEqual(``);
      expect(status).toEqual(0);
    });

    it('should have written links to a file', () => {
      const linksFile = path.join(process.cwd(), '.lighthouseci/links.json');
      const links = fs.readFileSync(linksFile, 'utf8');
      expect(cleanStdOutput(links)).toMatchInlineSnapshot(`
        "{
          \\"http://localhost:XXXX/app/\\": \\"https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/XXXX-XXXX.report.html\\"
        }"
      `);
    });

    it('should fail repeated attempts', () => {
      const {stdout, stderr, status} = runCLI(
        ['upload', `--serverBaseUrl=http://localhost:${server.port}`],
        {env: {LHCI_TOKEN: projectToken}}
      );

      expect(stdout).toEqual('');
      expect(stderr).toContain('Unexpected status code 422');
      expect(stderr).toContain('Build already exists for hash');
      expect(status).toEqual(1);
    });
  });

  describe('assert', () => {
    it('should assert failures', () => {
      const {stdout, stderr, status} = runCLI(['assert', `--assertions.works-offline=error`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31mX[0m  [1mworks-offline[0m failure for [1mminScore[0m assertion
             Current page does not respond with a 200 when offline
             Documentation: https://web.dev/works-offline

                expected: >=[32m1[0m
                   found: [31m0[0m
              [2mall values: 0, 0[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an rcfile', () => {
      const {stdout, stderr, status} = runCLI([
        'assert',
        `--assertions.first-contentful-paint=off`,
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--config=${rcFile}`,
      ]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31mX[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
             Performance budget
             Documentation: https://developers.google.com/web/tools/lighthouse/audits/budgets

                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from a matrix rcfile', () => {
      const {stdout, stderr, status} = runCLI(['assert', `--config=${rcMatrixFile}`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31mX[0m  [1mworks-offline[0m failure for [1mminScore[0m assertion
             Current page does not respond with a 200 when offline
             Documentation: https://web.dev/works-offline

                expected: >=[32m1[0m
                   found: [31m0[0m
              [2mall values: 0, 0[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an extended rcfile', () => {
      const {stdout, stderr, status} = runCLI([
        'assert',
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--config=${rcExtendedFile}`,
      ]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        2 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31mX[0m  [1mfirst-contentful-paint[0m failure for [1mmaxNumericValue[0m assertion
             First Contentful Paint
             Documentation: https://web.dev/first-contentful-paint

                expected: <=[32m1[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX, XXXX[0m


          [31mX[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
             Performance budget
             Documentation: https://developers.google.com/web/tools/lighthouse/audits/budgets

                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from a budgets file', () => {
      const {stdout, stderr, status} = runCLI(['assert', `--budgets-file=${budgetsFile}`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31mX[0m  [1mresource-summary[0m.script.size failure for [1mmaxNumericValue[0m assertion
             Keep request counts low and transfer sizes small
             Documentation: https://developers.google.com/web/tools/lighthouse/audits/budgets

                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX, XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });
  });

  describe('ui', () => {
    /** @type {import('puppeteer').Browser} */
    let browser;
    /** @type {import('puppeteer').Page} */
    let page;

    beforeAll(async () => {
      browser = await puppeteer.launch();
    });

    afterAll(async () => {
      await browser.close();
    });

    it('should load the page', async () => {
      page = await browser.newPage();
      await page.goto(`http://localhost:${server.port}/app`, {waitUntil: 'networkidle0'});
    });

    it('should list the projects', async () => {
      const contents = await page.evaluate('document.body.innerHTML');
      expect(contents).toContain('AwesomeCIProjectName');
    });
  });
});
