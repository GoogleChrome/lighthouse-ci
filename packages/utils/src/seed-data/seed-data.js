/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {createLHR} = require('./lhr-generator.js');
const {createDefaultDataset} = require('./dataset-generator.js');

/** @typedef {import('../api-client.js')} ApiClient */

/**
 * @param {ApiClient} client
 * @param {{projects: LHCI.ServerCommand.Project[], builds: LHCI.ServerCommand.Build[], runs: LHCI.ServerCommand.Run[]}} [rawData]
 */
async function writeSeedDataToApi(client, rawData) {
  let data = rawData || createDefaultDataset();
  data = JSON.parse(JSON.stringify(data));
  if (!data) throw new Error('TS cannot infer truth');

  if (rawData) {
    data.runs.forEach((run, i) => {
      run.lhr = rawData.runs[i].lhr;
    });
  }

  /** @type {Array<LHCI.ServerCommand.Project>} */
  const projects = [];
  for (const project of data.projects) {
    delete project.id;
    projects.push(await client.createProject(project));
  }

  /** @type {Array<LHCI.ServerCommand.Build>} */
  const builds = [];
  for (const build of data.builds) {
    delete build.id;
    const project = projects[Number(build.projectId)];
    build.projectId = project.id;
    build.lifecycle = 'unsealed';
    client.setBuildToken(project.token);
    builds.push(await client.createBuild(build));
  }

  for (const run of data.runs) {
    delete run.id;
    run.projectId = projects[Number(run.projectId)].id;
    run.buildId = builds[Number(run.buildId)].id;
    run.representative = false;
    await client.createRun({
      ...run,
      lhr:
        // @ts-ignore - allow programmatic creation of LHR
        typeof run.lhr === 'function' ? run.lhr() : run.lhr,
    });
  }

  for (const build of builds) {
    await client.sealBuild(build.projectId, build.id);
  }
}

module.exports = {createLHR, createDefaultDataset, writeSeedDataToApi};
