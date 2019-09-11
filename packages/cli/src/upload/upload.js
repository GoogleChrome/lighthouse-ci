/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const crypto = require('crypto');
const childProcess = require('child_process');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {getSavedLHRs} = require('@lhci/utils/src/saved-reports.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    token: {type: 'string', required: true},
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
  if (result.status !== 0) {
    throw new Error('Unable to determine current hash with `git rev-parse HEAD`');
  }

  return result.stdout.trim();
}

/**
 * @return {string}
 */
function getCurrentBranch() {
  if (process.env.TRAVIS_BRANCH) return process.env.TRAVIS_BRANCH;

  const result = childProcess.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine current branch with `git rev-parse --abbrev-ref HEAD`');
  }

  return result.stdout.trim().slice(0, 40);
}

/**
 * @return {string}
 */
function getExternalBuildUrl() {
  return process.env.TRAVIS_BUILD_WEB_URL || '';
}

/**
 * @return {string}
 */
function getCommitMessage() {
  const result = childProcess.spawnSync('git', ['log', '--format=%s', '-n', '1'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit message with `git log --format=%s -n 1`');
  }

  return result.stdout.trim().slice(0, 80);
}

/**
 * @return {string}
 */
function getAuthor() {
  const result = childProcess.spawnSync('git', ['log', '--format=%aN <%aE>', '-n', '1'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit author with `git log --format=%aN <%aE> -n 1`');
  }

  return result.stdout.trim().slice(0, 256);
}

/**
 * @return {string}
 */
function getAvatarUrl() {
  const result = childProcess.spawnSync('git', ['log', '--format=%aE', '-n', '1'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit email with `git log --format=%aE -n 1`');
  }

  // Use default gravatar image, see https://en.gravatar.com/site/implement/images/.
  const hash = crypto.createHash('md5');
  hash.update(result.stdout.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash.digest('hex')}.jpg?d=identicon`;
}

/**
 * @return {string}
 */
function getAncestorHash() {
  const result = childProcess.spawnSync('git', ['merge-base', 'HEAD', 'master'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error('Unable to determine current hash with `git merge-base HEAD master`');
  }

  return result.stdout.trim();
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const api = new ApiClient({rootURL: options.serverBaseUrl});

  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }

  const build = await api.createBuild({
    projectId: project.id,
    lifecycle: 'unsealed',
    hash: getCurrentHash(),
    branch: getCurrentBranch(),
    commitMessage: getCommitMessage(),
    author: getAuthor(),
    avatarUrl: getAvatarUrl(),
    ancestorHash: getAncestorHash(),
    externalBuildUrl: getExternalBuildUrl(),
    runAt: new Date().toISOString(),
  });

  process.stdout.write(`Saving CI project ${project.name} (${project.id})\n`);
  process.stdout.write(`Saving CI build (${build.id})\n`);

  const lhrs = getSavedLHRs();

  for (const lhr of lhrs) {
    const parsedLHR = JSON.parse(lhr);
    const run = await api.createRun({
      projectId: project.id,
      buildId: build.id,
      representative: false,
      url: parsedLHR.finalUrl,
      lhr,
    });

    process.stdout.write(`Saved LHR to ${options.serverBaseUrl} (${run.id})\n`);
  }

  await api.sealBuild(build.projectId, build.id);
  process.stdout.write(`Done saving build results to Lighthouse CI\n`);
}

module.exports = {buildCommand, runCommand};
