/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const childProcess = require('child_process');
const LighthouseRunner = require('./lighthouse-runner.js');
const ApiClient = require('../server/api/client.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    token: {type: 'string', required: true},
    method: {type: 'string', choices: ['node', 'docker'], default: 'node'},
    auditUrl: {description: 'The URL to audit.', required: true},
    numberOfRuns: {
      description: 'The number of times to run Lighthouse.',
      default: 3,
      type: 'number',
    },
    serverBaseUrl: {
      description: 'The base URL of the server where results will be saved.',
      default: 'http://localhost:9001/',
    },
  });
}

/**
 * @return {string}
 */
function getCurrentHash() {
  const result = childProcess.spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error('Unable to determine current hash');
  return result.stdout.trim();
}

/**
 * @return {string}
 */
function getExternalBuildId() {
  return '';
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (options.method !== 'node') throw new Error(`Method "${options.method}" not yet supported`);
  const runner = new LighthouseRunner();
  const api = new ApiClient({rootURL: options.serverBaseUrl});

  const project = await api.findProjectByToken(options.token);
  const build = await api.createBuild({
    projectId: project.id,
    hash: getCurrentHash(),
    externalBuildId: getExternalBuildId(),
  });

  process.stdout.write(`Running CI for project ${project.name} (${project.id})\n`);
  process.stdout.write(`Running CI for build (${build.id})\n`);

  for (let i = 0; i < options.numberOfRuns; i++) {
    const lhr = await runner.run(options.auditUrl);
    const run = await api.createRun({
      projectId: project.id,
      buildId: build.id,
      lhr: JSON.stringify(lhr),
    });

    process.stdout.write(`Saved LHR to ${options.serverBaseUrl} (${run.id})\n`);
  }

  process.stdout.write(`Done saving build results to Lighthouse CI!\n`);
}

module.exports = {buildCommand, runCommand};
