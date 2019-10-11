/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const {spawn, spawnSync} = require('child_process');
const fetch = require('isomorphic-fetch');
const log = require('lighthouse-logger');
const puppeteer = require('puppeteer');
const {startServer, waitForCondition, CLI_PATH} = require('./test-utils.js');

describe('Lighthouse CI CLI', () => {
  const rcFile = path.join(__dirname, 'fixtures/lighthouserc.json');
  const rcExtendedFile = path.join(__dirname, 'fixtures/lighthouserc-extended.json');
  const budgetsFile = path.join(__dirname, 'fixtures/budgets.json');

  let server;
  let projectToken;
  let urlToCollect;

  afterAll(() => {
    if (server) {
      server.process.kill();
      if (fs.existsSync(server.sqlFile)) fs.unlinkSync(server.sqlFile);
    }
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
      const wizardProcess = spawn(CLI_PATH, ['wizard']);
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
  });

  describe('collect', () => {
    it('should collect results', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
        'collect',
        `--rc-file=${rcFile}`,
        `--url=${urlToCollect}`,
      ]);

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      expect(stdout).toMatchInlineSnapshot(`
        "Running Lighthouse 2 time(s)
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
      let {stdout = '', stderr = '', status = -1} = spawnSync(
        CLI_PATH,
        ['upload', `--serverBaseUrl=http://localhost:${server.port}`],
        {env: {...process.env, LHCI_TOKEN: projectToken, LHCI_GITHUB_TOKEN: ''}}
      );

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const UUID_REGEX = /[0-9a-f-]{36}/gi;
      uuids = stdout.match(UUID_REGEX);
      const cleansedStdout = stdout.replace(UUID_REGEX, '<UUID>').replace(/:\d+/g, '<PORT>');
      expect(cleansedStdout).toMatchInlineSnapshot(`
        "Saving CI project AwesomeCIProjectName (<UUID>)
        Saving CI build (<UUID>)
        Saved LHR to http://localhost<PORT> (<UUID>)
        Saved LHR to http://localhost<PORT> (<UUID>)
        Done saving build results to Lighthouse CI
        View build diff at http://localhost<PORT>/app/projects/<UUID>/builds/<UUID>
        No GitHub token set, skipping status check.
        "
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
      expect(uuids).toHaveLength(6);
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
      let {stdout = '', stderr = '', status = -1} = spawnSync(
        CLI_PATH,
        ['upload', `--target=temporary-public-storage`],
        {env: {...process.env, LHCI_GITHUB_TOKEN: ''}}
      );

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      expect(stdout).toContain('...success!');
      expect(stdout).toContain('Open the report at');
      expect(stderr).toEqual(``);
      expect(status).toEqual(0);
    });
  });

  describe('assert', () => {
    it('should assert failures', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
        'assert',
        `--assertions.works-offline=error`,
      ]);

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const stderrClean = stderr.replace(/:\d{4,6}/g, ':XXXX');
      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderrClean).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31m✘[0m  [1mworks-offline[0m failure for [1mminScore[0m assertion
                expected: >=[32m1[0m
                   found: [31m0[0m
              [2mall values: 0, 0[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an rcfile', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
        'assert',
        `--assertions.first-contentful-paint=off`,
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--rc-file=${rcFile}`,
      ]);

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const stderrClean = stderr.replace(/\d{4,8}(\.\d{1,8})?/g, 'XXXX');
      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderrClean).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31m✘[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from an extended rcfile', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
        'assert',
        `--assertions.speed-index=off`,
        `--assertions.interactive=off`,
        `--rc-file=${rcExtendedFile}`,
      ]);

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const stderrClean = stderr.replace(/\d{4,}(\.\d{1,})?/g, 'XXXX');
      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderrClean).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        2 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31m✘[0m  [1mfirst-contentful-paint[0m failure for [1mmaxNumericValue[0m assertion
                expected: <=[32m1[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX, XXXX[0m


          [31m✘[0m  [1mperformance-budget[0m.script.size failure for [1mmaxNumericValue[0m assertion
                expected: <=[32mXXXX[0m
                   found: [31mXXXX[0m
              [2mall values: XXXX[0m

        Assertion failed. Exiting with status code 1.
        "
      `);
      expect(status).toEqual(1);
    });

    it('should assert failures from a budgets file', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
        'assert',
        `--budgets-file=${budgetsFile}`,
      ]);

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const stderrClean = stderr.replace(/\d{4,}(\.\d{1,})?/g, 'XXXX');
      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderrClean).toMatchInlineSnapshot(`
        "Checking assertions against 1 URL(s), 2 total run(s)

        1 result(s) for [1mhttp://localhost:XXXX/app/[0m

          [31m✘[0m  [1mresource-summary[0m.script.size failure for [1mmaxNumericValue[0m assertion
                expected: <=[32m1[0m
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
