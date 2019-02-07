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
    let uuids;

    it(
      'should collect results',
      () => {
        let {stdout = '', stderr = '', status = -1} = spawnSync(
          CLI_PATH,
          [
            'collect',
            '--numberOfRuns=2',
            '--auditUrl=chrome://version',
            `--serverBaseUrl=http://localhost:${serverPort}`,
          ],
          {env: {...process.env, LHCI_TOKEN: projectToken}}
        );

        stdout = stdout.toString();
        stderr = stderr.toString();
        status = status || 0;

        const UUID_REGEX = /[0-9a-f-]{36}/gi;
        uuids = stdout.match(UUID_REGEX);
        const cleansedStdout = stdout.replace(UUID_REGEX, '<UUID>').replace(/:\d+/g, '<PORT>');
        expect(cleansedStdout).toMatchInlineSnapshot(`
"Running CI for project Lighthouse (<UUID>)
Running CI for build (<UUID>)
Saved LHR to http://localhost<PORT> (<UUID>)
Saved LHR to http://localhost<PORT> (<UUID>)
Done saving build results to Lighthouse CI!
"
`);
        expect(stderr.toString()).toMatchInlineSnapshot(`""`);
        expect(status).toEqual(0);
        expect(uuids).toHaveLength(4);
      },
      20000
    );

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
});
