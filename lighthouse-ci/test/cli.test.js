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

const CLI_PATH = path.join(__dirname, '../src/cli.js');

function waitForCondition(fn) {
  let resolve;
  const promise = new Promise(r => (resolve = r));

  function checkConditionOrContinue() {
    if (fn()) return resolve();
    setTimeout(checkConditionOrContinue, 500);
  }

  checkConditionOrContinue();
  return promise;
}

describe('Lighthouse CI CLI', () => {
  const sqlFile = 'cli-test.tmp.sql';
  const rcFile = path.join(__dirname, 'fixtures/lighthouserc.json');

  let serverPort;
  let serverProcess;
  let serverProcessStdout = '';

  let projectToken;

  afterAll(() => {
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
    serverProcess.kill();
  });

  describe('server', () => {
    it('should bring up the server and accept requests', async () => {
      serverProcess = spawn(CLI_PATH, ['server', '-p=0', `--storage.sqlDatabasePath=${sqlFile}`]);

      serverProcess.stdout.on('data', chunk => (serverProcessStdout += chunk.toString()));

      await waitForCondition(() => serverProcessStdout.includes('listening'));

      expect(serverProcessStdout).toMatch(/port \d+/);
      serverPort = serverProcessStdout.match(/port (\d+)/)[1];
    });

    it('should accept requests', async () => {
      let response = await fetch(`http://localhost:${serverPort}/v1/projects`);
      let projects = await response.json();
      expect(projects).toEqual([]);

      const payload = {name: 'Lighthouse', externalUrl: 'http://example.com'};
      response = await fetch(`http://localhost:${serverPort}/v1/projects`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const project = await response.json();
      expect(project).toMatchObject(payload);

      response = await fetch(`http://localhost:${serverPort}/v1/projects`);
      projects = await response.json();
      expect(projects).toEqual([project]);

      response = await fetch(`http://localhost:${serverPort}/v1/projects/${project.id}/token`);
      const {token} = await response.json();
      expect(typeof token).toBe('string');
      projectToken = token;
    });
  });

  describe('collect', () => {
    it(
      'should collect results',
      () => {
        let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
          'collect',
          `--rc-file=${rcFile}`,
          '--headful',
          '--auditUrl=chrome://version',
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
      },
      60000
    );
  });

  describe('report', () => {
    let uuids;
    it('should read LHRs from folders', () => {
      let {stdout = '', stderr = '', status = -1} = spawnSync(
        CLI_PATH,
        ['report', `--serverBaseUrl=http://localhost:${serverPort}`],
        {env: {...process.env, LHCI_TOKEN: projectToken}}
      );

      stdout = stdout.toString();
      stderr = stderr.toString();
      status = status || 0;

      const UUID_REGEX = /[0-9a-f-]{36}/gi;
      uuids = stdout.match(UUID_REGEX);
      const cleansedStdout = stdout.replace(UUID_REGEX, '<UUID>').replace(/:\d+/g, '<PORT>');
      expect(cleansedStdout).toMatchInlineSnapshot(`
"Saving CI project Lighthouse (<UUID>)
Saving CI build (<UUID>)
Saved LHR to http://localhost<PORT> (<UUID>)
Saved LHR to http://localhost<PORT> (<UUID>)
Done saving build results to Lighthouse CI
"
`);
      expect(stderr).toMatchInlineSnapshot(`""`);
      expect(status).toEqual(0);
      expect(uuids).toHaveLength(4);
    });

    it('should have saved lhrs to the API', async () => {
      const [projectId, buildId, runAId, runBId] = uuids;
      const response = await fetch(
        `http://localhost:${serverPort}/v1/projects/${projectId}/builds/${buildId}/runs`
      );

      const runs = await response.json();
      expect(runs.map(run => run.id)).toEqual([runBId, runAId]);
      expect(runs.map(run => JSON.parse(run.lhr))).toMatchObject([
        {requestedUrl: 'chrome://version'},
        {requestedUrl: 'chrome://version'},
      ]);
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

      expect(stdout).toMatchInlineSnapshot(`""`);
      expect(stderr).toMatchInlineSnapshot(`
"Checking assertions against 2 run(s)

[31m✘[0m [1mworks-offline[0m failure for [1mminScore[0m assertion
      expected: >=[32m1[0m
         found: [31m0[0m
    [2mall values: 0, 0[0m

Assertion failed. Exiting with status code 1.
"
`);
      expect(status).toEqual(1);
    });
  });
});
