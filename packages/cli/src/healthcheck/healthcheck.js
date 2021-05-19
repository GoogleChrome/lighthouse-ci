/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const log = require('debug')('lhci:cli:healthcheck');
const {canAccessPath, determineChromePath} = require('../utils.js');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {loadAndParseRcFile, resolveRcFilePath} = require('@lhci/utils/src/lighthouserc.js');
const {
  getCurrentHash,
  getAncestorHash,
  getCurrentBranch,
  getGitHubRepoSlug,
} = require('@lhci/utils/src/build-context.js');
const {loadSavedLHRs} = require('@lhci/utils/src/saved-reports.js');
const pkg = require('../../package.json');

const PASS_ICON = '✅';
const WARN_ICON = '⚠️ ';
const FAIL_ICON = '❌';

/** @param {LHCI.YargsOptions} options @return {ApiClient} */
const getApiClient = options => new ApiClient({...options, rootURL: options.serverBaseUrl || ''});

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    fatal: {
      type: 'boolean',
      description: 'Exit with a non-zero status code when a component fails the status check.',
    },
    checks: {
      type: 'array',
      description: 'The list of opt-in checks to include in the fatality check.',
    },
  });
}

/** @type {Array<{id?: string, label: string, failureLabel: string, test: (opts: LHCI.YargsOptions) => Promise<boolean>|boolean, shouldTest: (opts: LHCI.YargsOptions) => boolean}>} */
const checks = [
  {
    label: '.lighthouseci/ directory writable',
    failureLabel: '.lighthouseci/ directory not writable',
    shouldTest: () => true,
    test: () => loadSavedLHRs().length >= 0,
  },
  {
    id: 'rcFile',
    label: 'Configuration file found',
    failureLabel: 'Configuration file not found',
    shouldTest: () => true,
    test: opts => {
      const rcFile = resolveRcFilePath(opts.config);
      if (!rcFile) return false;
      log('checking for config file at', rcFile);
      return Boolean(loadAndParseRcFile(rcFile));
    },
  },
  {
    label: 'Chrome installation found',
    failureLabel: 'Chrome installation not found',
    shouldTest: opts => (opts && opts.method) !== 'psi',
    test: opts => {
      const chromePath = opts.chromePath || determineChromePath(opts) || '';
      log('checking chrome path', chromePath || 'NONE_FOUND');
      return canAccessPath(chromePath);
    },
  },
  {
    id: 'githubToken',
    label: 'GitHub token set',
    failureLabel: 'GitHub token not set',
    // the test only makes sense if they've configured an upload target of some sort
    shouldTest: opts => !!getGitHubRepoSlug() && (!!opts.target || !!opts.serverBaseUrl),
    test: opts => Boolean(opts.githubToken || opts.githubAppToken),
  },
  {
    id: 'lhciServer',
    label: 'Ancestor hash determinable',
    failureLabel: 'Ancestor hash not determinable',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async opts => {
      log('checking project at API', opts.serverBaseUrl, 'with token', opts.token);
      const client = getApiClient(opts);
      const project = await client.findProjectByToken(opts.token || '');
      return getAncestorHash('HEAD', (project && project.baseBranch) || 'master').length > 0;
    },
  },
  {
    id: 'lhciServer',
    label: 'LHCI server reachable',
    failureLabel: 'LHCI server not reachable',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async opts => (await getApiClient(opts).getVersion()).length > 0,
  },
  {
    id: 'lhciServer',
    label: 'LHCI server API-compatible',
    failureLabel: 'LHCI server not API-compatible',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async opts =>
      ApiClient.isApiVersionCompatible(pkg.version, await getApiClient(opts).getVersion()),
  },
  {
    id: 'lhciServer',
    label: 'LHCI server token valid',
    failureLabel: 'LHCI server token invalid',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async opts => {
      log('checking project at API', opts.serverBaseUrl, 'with token', opts.token);
      const client = getApiClient(opts);
      const project = await client.findProjectByToken(opts.token || '');
      return Boolean(project);
    },
  },
  {
    id: 'lhciServer',
    label: 'LHCI server can accept a build for this commit hash',
    failureLabel: 'LHCI server already has a build for this commit hash',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async opts => {
      const client = getApiClient(opts);
      const project = await client.findProjectByToken(opts.token || '');
      if (!project) return true;
      const branch = getCurrentBranch();
      const hash = getCurrentHash();
      const builds = await client.getBuilds(project.id, {branch, hash});
      log(`checking for pre-existing builds on branch "${branch}" and hash "${hash}"`);
      return builds.length === 0;
    },
  },
];

/**
 * @param {LHCI.YargsOptions} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const checkIdsToRun = options.checks || [];

  let allPassed = true;
  for (const check of checks) {
    if (!check.shouldTest(options)) continue;

    let result = false;
    let message = '';
    try {
      result = await check.test(options);
    } catch (err) {
      result = false;
      message = `\n    ERROR: ${err.message}`;
    }

    const isWarn = !!check.id && !checkIdsToRun.includes(check.id);
    const icon = result ? PASS_ICON : isWarn ? WARN_ICON : FAIL_ICON;
    const label = result ? check.label : check.failureLabel;
    allPassed = allPassed && (isWarn || result);
    process.stdout.write(`${icon}  ${label}${message}\n`);
  }

  if (allPassed) {
    process.stdout.write('Healthcheck passed!\n');
  } else {
    process.stdout.write('Healthcheck failed!\n');
    if (options.fatal) process.exit(1);
  }
}

module.exports = {buildCommand, runCommand};
