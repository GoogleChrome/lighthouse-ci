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
const log = require('lighthouse-logger');
const ApiClient = require('../../utils/src/api-client.js');
const {startServer, safeDeleteFile, runWizardCLI} = require('./test-utils.js');

describe('wizard CLI', () => {
  let server;
  let projectToken;
  let projectAdminToken;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    if (server) {
      server.process.kill();
      await safeDeleteFile(server.sqlFile);
    }
  });

  describe('new-project', () => {
    it('should create a new project', async () => {
      const {stdout, stderr, status} = await runWizardCLI(
        [],
        [
          '', // Just ENTER key to select "new-project"
          `http://localhost:${server.port}`, // The base URL to talk to
          'AwesomeCIProjectName', // Project name
          'https://example.com', // External build URL
          'development', // baseBranch
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

      const client = new ApiClient({
        rootURL: `http://localhost:${server.port}`,
        basicAuth: {password: 'lighthouse'},
      });
      const project = await client.findProjectByToken(projectToken);
      expect(project).toMatchObject({
        name: 'AwesomeCIProjectName',
        externalUrl: 'https://example.com',
        baseBranch: 'development',
      });
    }, 30000);

    it('should create a new project with config file', async () => {
      server.process.kill();
      server = await startServer(server.sqlFile, ['--basicAuth.password=lighthouse']);

      const wizardTempConfigFile = {
        ci: {
          wizard: {
            serverBaseUrl: `http://localhost:${server.port}`,
            basicAuth: {password: 'lighthouse'},
          },
        },
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
    }, 30000);
  });

  describe('reset-build-token', () => {
    it('should reset the build token', async () => {
      const storage = {storageMethod: 'sql', sqlDialect: 'sqlite', sqlDatabasePath: server.sqlFile};
      const wizardTempConfigFile = {ci: {wizard: {wizard: 'reset-build-token', storage}}};
      const tmpFolder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
      const wizardRcFile = `${tmpFolder}/wizard.json`;
      fs.writeFileSync(wizardRcFile, JSON.stringify(wizardTempConfigFile), {encoding: 'utf8'});

      const {stdout, stderr, status} = await runWizardCLI(
        [`--config=${wizardRcFile}`],
        [
          '', // Just ENTER key to select the first project
          'AwesomeCIProjectName', // Confirm project name
        ],
        {inputWaitCondition: 'Which project'}
      );

      // Extract the build token
      expect(stdout).toContain('Use build token');
      const projectSentence = stdout
        .match(/Use build token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      const oldProjectToken = projectToken;
      projectToken = projectSentence.match(/Use build token (\S+)/)[1];

      expect(stderr).toEqual('');
      expect(status).toEqual(0);
      expect(projectToken).toHaveLength(oldProjectToken.length);

      const client = new ApiClient({
        rootURL: `http://localhost:${server.port}`,
        basicAuth: {password: 'lighthouse'},
      });

      const project = await client.findProjectByToken(projectToken);
      expect(project).toHaveProperty('name', 'AwesomeCIProjectName');
      const projectByOldToken = await client.findProjectByToken(oldProjectToken);
      expect(projectByOldToken).toEqual(undefined);
    }, 30000);
  });

  describe('reset-admin-token', () => {
    it('should reset the admin token', async () => {
      const storage = {storageMethod: 'sql', sqlDialect: 'sqlite', sqlDatabasePath: server.sqlFile};
      const wizardTempConfigFile = {ci: {wizard: {wizard: 'reset-admin-token', storage}}};
      const tmpFolder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
      const wizardRcFile = `${tmpFolder}/wizard.json`;
      fs.writeFileSync(wizardRcFile, JSON.stringify(wizardTempConfigFile), {encoding: 'utf8'});

      const {stdout, stderr, status} = await runWizardCLI(
        [`--config=${wizardRcFile}`],
        [
          '', // Just ENTER key to select the first project
          'AwesomeCIProjectName', // Confirm project name
        ],
        {inputWaitCondition: 'Which project'}
      );

      // Extract the admin token
      expect(stdout).toContain('Use admin token');
      const adminSentence = stdout
        .match(/Use admin token [\s\S]+/im)[0]
        .replace(log.bold, '')
        .replace(log.reset, '');
      const oldAdminToken = projectAdminToken;
      projectAdminToken = adminSentence.match(/Use admin token (\w+)/)[1];

      expect(stderr).toEqual('');
      expect(status).toEqual(0);

      const client = new ApiClient({
        rootURL: `http://localhost:${server.port}`,
        basicAuth: {password: 'lighthouse'},
      });
      const project = await client.findProjectByToken(projectToken);

      client.setAdminToken(oldAdminToken);
      expect(await client.getProjects()).toHaveLength(2);
      await expect(client.deleteProject(project.id)).rejects.toBeDefined();
      expect(await client.getProjects()).toHaveLength(2);

      client.setAdminToken(projectAdminToken);
      expect(await client.getProjects()).toHaveLength(2);
      await client.deleteProject(project.id);
      expect(await client.getProjects()).toHaveLength(1);
    }, 30000);
  });
});
