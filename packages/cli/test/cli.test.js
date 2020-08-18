/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const os = require('os');
const fs = require('fs');
const fetch = require('isomorphic-fetch');
const log = require('lighthouse-logger');
const puppeteer = require('puppeteer');
const ApiClient = require('../../utils/src/api-client.js');
const {
  startServer,
  cleanStdOutput,
  getSqlFilePath,
  safeDeleteFile,
  runCLI,
  runWizardCLI,
} = require('./test-utils.js');

jest.setTimeout(120e3);

describe('Lighthouse CI CLI', () => {
  const rcFile = path.join(__dirname, 'fixtures/lighthouserc.json');
  const rcMatrixFile = path.join(__dirname, 'fixtures/lighthouserc-matrix.json');
  const rcExtendedFile = path.join(__dirname, 'fixtures/lighthouserc-extended.json');
  const budgetsFile = path.join(__dirname, 'fixtures/budgets.json');
  const tmpSqlFilePath = getSqlFilePath();

  let server;
  let projectToken;
  let projectAdminToken;
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
    it('should create a new project', async () => {
      const {stdout, stderr, status} = await runWizardCLI(
        [],
        [
          '', // Just ENTER key to select "new-project"
          `http://localhost:${server.port}`, // The base URL to talk to
          'AwesomeCIProjectName', // Project name
          'https://example.com', // External build URL
          '', // Default baseBranch
        ]
      );

      expect(stderr).toEqual('');
      expect(status).toEqual(0);

      // Extract the regular token
      expect(stdout).toContain('Use build token');
      const tokenSentence = stdout
        .match(/Use build token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      projectToken = tokenSentence.match(/Use build token ([\w-]+)/)[1];

      // Extract the admin token
      expect(stdout).toContain('Use admin token');
      const adminSentence = stdout
        .match(/Use admin token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      projectAdminToken = adminSentence.match(/Use admin token (\w+)/)[1];
    });

    it('should create a new project with config file', async () => {
      const wizardTempConfigFile = {
        ci: {wizard: {serverBaseUrl: `http://localhost:${server.port}`}},
      };
      const tmpFolder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
      const wizardRcFile = `${tmpFolder}/wizard.json`;
      fs.writeFileSync(wizardRcFile, JSON.stringify(wizardTempConfigFile), {encoding: 'utf8'});

      const {stdout, stderr, status} = await runWizardCLI(
        [`--config=${wizardRcFile}`],
        [
          '', // Just ENTER key to select "new-project"
          '', // Just ENTER key to use serverBaseUrl from config file
          'OtherCIProjectName', // Project name
          'https://example.com', // External build URL
          '', // Default baseBranch
        ]
      );

      expect(stderr).toEqual('');
      expect(status).toEqual(0);
      expect(stdout).toContain(`http://localhost:${server.port}`);
    });
  });

  describe('healthcheck', () => {
    it('should pass when things are good', async () => {
      const LHCI_TOKEN = projectToken;
      const LHCI_SERVER_BASE_URL = `http://localhost:${server.port}`;
      const {stdout, stderr, status} = await runCLI(['healthcheck', `--fatal`], {
        env: {LHCI_TOKEN, LHCI_SERVER_BASE_URL},
      });

      expect(stdout).toMatchInlineSnapshot(`
        "✅  .lighthouseci/ directory writable
        ⚠️   Configuration file not found
        ✅  Chrome installation found
        ⚠️   GitHub token not set
        ✅  Ancestor hash determinable
        ✅  LHCI server reachable
        ✅  LHCI server API-compatible
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
      const {stdout, stderr, status} = await runCLI(
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
        ✅  LHCI server API-compatible
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
    it('should collect results with a server command', async () => {
      // FIXME: for some inexplicable reason this test cannot pass in Travis Windows
      if (os.platform() === 'win32') return;

      const startCommand = `yarn start server -p=14927 --storage.sqlDatabasePath=${tmpSqlFilePath}`;
      const {stdout, stderr, status} = await runCLI([
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
    });
    it('should collect results from explicit urls', async () => {
      const {stdout, stderr, status} = await runCLI([
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
    });
  });

  describe('upload', () => {
    let uuids;
    it('should read LHRs from folders', async () => {
      const {stdout, stderr, status, matches} = await runCLI(
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
        No GitHub token set, skipping GitHub status check.
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
      expect(uuids).toHaveLength(5);
    });

    it('should have written links to a file', async () => {
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
      const {stdout, stderr, status} = await runCLI([
        'upload',
        `--target=temporary-public-storage`,
      ]);

      expect(stdout).toContain('...success!');
      expect(stdout).toContain('Open the report at');
      expect(stderr).toEqual(``);
      expect(status).toEqual(0);
    });

    it('should have written links to a file', async () => {
      const linksFile = path.join(process.cwd(), '.lighthouseci/links.json');
      const links = fs.readFileSync(linksFile, 'utf8');
      expect(links).toContain('http://localhost');
      expect(links).toContain('/app/');
      expect(links).toContain('storage.googleapis.com');
    });

    it('should fail repeated attempts', async () => {
      const {stdout, stderr, status} = await runCLI(
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
    it('should assert failures', async () => {
      const {stdout, stderr, status} = await runCLI(['assert', `--assertions.works-offline=error`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m :

          [31mX[0m  [1mworks-offline[0m failure for [1mminScore[0m assertion
               Current page does not respond with a 200 when offline
               https://web.dev/works-offline/

                expected: >=[32m0.9[0m
                   found: [31m0[0m
              [2mall values: 0, 0[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an rcfile', async () => {
      const {stdout, stderr, status} = await runCLI([
        'assert',
        `--assertions.first-contentful-paint=off`,
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--config=${rcFile}`,
      ]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m :

          [31mX[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
               Performance budget
               https://developers.google.com/web/tools/lighthouse/audits/budgets

                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from a matrix rcfile', async () => {
      const {stdout, stderr, status} = await runCLI(['assert', `--config=${rcMatrixFile}`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m :

          [31mX[0m  [1mworks-offline[0m failure for [1mminScore[0m assertion
               Current page does not respond with a 200 when offline
               https://web.dev/works-offline/

                expected: >=[32m0.9[0m
                   found: [31m0[0m
              [2mall values: 0, 0[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an extended rcfile', async () => {
      const {stdout, stderr, status} = await runCLI([
        'assert',
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--config=${rcExtendedFile}`,
      ]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        2 result(s) for [1mhttp://localhost:XXXX/app/[0m :

          [31mX[0m  [1mfirst-contentful-paint[0m failure for [1mmaxNumericValue[0m assertion
               First Contentful Paint
               https://web.dev/first-contentful-paint/

                expected: <=[32m1[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX, XXXX[0m


          [31mX[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
               Performance budget
               https://developers.google.com/web/tools/lighthouse/audits/budgets

                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from a budgets file', async () => {
      const {stdout, stderr, status} = await runCLI(['assert', `--budgets-file=${budgetsFile}`]);

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m :

          [31mX[0m  [1mresource-summary[0m.script.size failure for [1mmaxNumericValue[0m assertion
               Keep request counts low and transfer sizes small
               https://web.dev/use-lighthouse-for-performance-budgets/

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
      expect(contents).toContain('OtherCIProjectName');
    });

    it('should delete the project', async () => {
      const client = new ApiClient({rootURL: `http://localhost:${server.port}`});
      client.setAdminToken(projectAdminToken);
      const project = await client.findProjectByToken(projectToken);
      await client.deleteProject(project.id);
    });

    it('should list the projects again', async () => {
      page = await browser.newPage();
      await page.goto(`http://localhost:${server.port}/app`, {waitUntil: 'networkidle0'});
      const contents = await page.evaluate('document.body.innerHTML');
      expect(contents).not.toContain('AwesomeCIProjectName');
      expect(contents).toContain('OtherCIProjectName');
    });
  });
});
