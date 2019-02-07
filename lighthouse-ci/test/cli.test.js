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
  const promise = new Promise(r => resolve = r);

  function checkConditionOrContinue() {
    if (fn()) return resolve();
    setTimeout(checkConditionOrContinue, 500);
  }

  checkConditionOrContinue();
  return promise;
}

describe('Lighthouse CI CLI', () => {
  describe('collect', () => {
    it(
      'should collect results',
      () => {
        const {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, [
          'collect',
          '--numberOfRuns=2',
          '--auditUrl=chrome://version',
        ]);

        expect(stdout.toString().replace(/fetched at .*/g, 'fetched at <DATE>'))
          .toMatchInlineSnapshot(`
"Would have beaconed LHR to http://localhost:9001/ fetched at <DATE>
Would have beaconed LHR to http://localhost:9001/ fetched at <DATE>
"
`);
        expect(stderr.toString()).toMatchInlineSnapshot(`""`);
        expect(status).toEqual(0);
      },
      20000
    );
  });

  describe('server', () => {
    it('should bring up the server and accept requests', async () => {
      const sqlFile = 'server-cmd-test.tmp.sql';
      const serverProcess = spawn(CLI_PATH, [
        'server',
        '-p=0',
        `--storage.sqlDatabasePath=${sqlFile}`,
      ]);

      let stdout = '';
      serverProcess.stdout.on('data', chunk => stdout += chunk.toString());

      try {
        await waitForCondition(() => stdout.includes('listening'));

        expect(stdout).toMatch(/port \d+/);
        const port = stdout.match(/port (\d+)/)[1];

        let response = await fetch(`http://localhost:${port}/v1/projects`);
        let projects = await response.json();
        expect(projects).toEqual([]);

        const sampleProject = {name: 'Lighthouse', externalUrl: 'http://example.com'};
        response = await fetch(`http://localhost:${port}/v1/projects`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify(sampleProject),
        });
        const createdProject = await response.json();
        expect(createdProject).toMatchObject(sampleProject);

        response = await fetch(`http://localhost:${port}/v1/projects`);
        projects = await response.json();
        expect(projects).toEqual([createdProject]);
      } finally {
        if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
        serverProcess.kill();
      }
    });
  });
});
