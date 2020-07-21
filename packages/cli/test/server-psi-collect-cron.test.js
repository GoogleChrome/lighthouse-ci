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
const ApiClient = require('@lhci/utils/src/api-client.js');
const {runCLIWithoutWaiting, waitForNonException} = require('./test-utils.js');
const {createServer: createPsiServer} = require('./fixtures/psi/mock-psi-server.js');

describe('Lighthouse CI server CLI PSI collection test', () => {
  let psiServer;
  let results;

  beforeAll(async () => {
    psiServer = await createPsiServer();
  });

  afterAll(async () => {
    await psiServer.close();
  });

  it('should start the server', async () => {
    const configFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'lhci-server'));
    const configPath = path.join(configFolder, 'lighthouserc.json');
    const config = {
      ci: {
        server: {
          port: 0,
          psiCollectCron: {
            psiApiKey: 'secret-key',
            psiApiEndpoint: `http://localhost:${psiServer.port}/runPagespeed`,
            sites: [
              {
                label: 'CronTest',
                schedule: '*',
                projectSlug: 'example',
                urls: ['http://example.com'],
                numberOfRuns: 1,
              },
            ],
          },
          storage: {
            sqlDatabasePath: path.join(configFolder, 'db.sql'),
          },
        },
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(config));
    results = runCLIWithoutWaiting(['server', '--config', configPath], {
      env: {OVERRIDE_SCHEDULE_FOR_TEST: '* * * * * *'},
    });

    await waitForNonException(() => {
      expect(results.stdout + results.stderr).toContain('Server listening on');
    });
  }, 10e3);

  it('should collect PSI results on a cron', async () => {
    const port = results.stdout.match(/on port (\d+)/)[1];
    const client = new ApiClient({rootURL: `http://localhost:${port}/`});
    const project = await client.createProject({
      name: 'Example',
      externalUrl: '',
      baseBranch: 'main',
      slug: 'example',
    });

    await waitForNonException(() => {
      expect(results.stdout).toContain('POST /v1/projects');
      expect(results.stdout).toContain('Scheduling cron for CronTest');
    });

    await waitForNonException(() => {
      expect(results.stdout + results.stderr).toMatch(/completed collection/);
    });

    const builds = await client.getBuilds(project.id);
    results.childProcess.kill();

    const cleanedStdOut = results.stdout
      .replace(/[\s\S]+POST \/v1\/projects.*\n/m, '')
      .replace(/.*Previous PSI collection.*/g, 'InProgress')
      .replace(/(InProgress\n)+/g, 'InProgress\n')
      .replace(/^\S+ - /gim, 'TIMESTAMP - ')
      .replace(/(completed collection.*)\n[\s\S]*/, '$1');

    expect(cleanedStdOut).toMatchInlineSnapshot(`
      "TIMESTAMP - Starting PSI collection for CronTest
      InProgress
      TIMESTAMP - Successfully completed collection for CronTest"
    `);

    expect(builds).toMatchObject([{branch: 'main', lifecycle: 'sealed'}]);
  }, 30e3);
});
