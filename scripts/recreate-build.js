#!/usr/bin/env node
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('url').URL;
const {loadAndParseRcFile} = require('../packages/utils/src/lighthouserc.js');
const ApiClient = require('../packages/utils/src/api-client.js');
const {writeSeedDataToApi} = require('../packages/utils/src/seed-data/seed-data.js');

const BUILD_URL_REGEX = /projects\/([^/]+)\/builds\/([^/]+)/;

if (process.argv.length !== 4) {
  process.stderr.write(`Usage ./scripts/recreate-build.js <path to rc file> <url to build>`);
  process.exit(1);
}

async function run() {
  const {serverBaseUrl} = loadAndParseRcFile(process.argv[2]);
  if (!serverBaseUrl) throw new Error('RC file did not set the serverBaseUrl');
  const buildUrl = new URL(process.argv[3]);
  const remoteApi = new ApiClient({rootURL: buildUrl.origin});

  const [_ = '', projectId = '', buildId = ''] = buildUrl.pathname.match(BUILD_URL_REGEX) || [];
  if (!projectId || !buildId) throw new Error(`Invalid build URL ${buildUrl.href}`);

  const sourceProject = await remoteApi.findProjectById(projectId);
  if (!sourceProject) throw new Error(`No project for ${projectId}`);
  const baseBuild = await remoteApi.findBuildById(projectId, buildId);
  if (!baseBuild) throw new Error(`No build for ${buildId}`);
  const ancestorBuild = await remoteApi.findAncestorBuildById(projectId, buildId);
  if (!ancestorBuild) throw new Error(`No ancestor build for ${buildId}`);

  const baseRuns = await remoteApi.getRuns(projectId, baseBuild.id, {representative: true});
  const ancestorRuns = await remoteApi.getRuns(projectId, ancestorBuild.id, {representative: true});

  /** @type {LHCI.ServerCommand.Project} */
  const project = {
    id: '',
    name: `Created from ${sourceProject.name}, ${baseBuild.commitMessage}`,
    slug: '',
    externalUrl: '',
    token: '',
    baseBranch: '',
    adminToken: '',
  };

  /** @type {Array<LHCI.ServerCommand.Build>} */
  const builds = [
    {
      ...baseBuild,
      id: '0',
      projectId: '0',
      lifecycle: 'unsealed',
    },
    {
      ...ancestorBuild,
      id: '1',
      projectId: '0',
      lifecycle: 'unsealed',
    },
  ];

  /** @type {Array<LHCI.ServerCommand.Run>} */
  const runs = [
    ...baseRuns.map(run => ({...run, projectId: '0', buildId: '0'})),
    ...ancestorRuns.map(run => ({...run, projectId: '0', buildId: '1'})),
  ];

  await writeSeedDataToApi(new ApiClient({rootURL: serverBaseUrl}), {
    projects: [project],
    builds,
    runs,
  });
}

run();
