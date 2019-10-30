/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ApiClient = require('@lhci/utils/src/api-client.js');
const {getCurrentHash, getAncestorHash} = require('@lhci/utils/src/build-context.js');
const {loadSavedLHRs} = require('@lhci/utils/src/saved-reports.js');

const PASS_ICON = '✅';
const WARN_ICON = '⚠️ ';
const FAIL_ICON = '❌';

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

/** @type {Array<{id?: string, label: string, test: (opts: LHCI.YargsOptions) => Promise<boolean>|boolean, shouldTest: (opts: LHCI.YargsOptions) => boolean}>} */
const checks = [
  {
    label: '.lighthouseci/ directory writable',
    shouldTest: () => true,
    test: () => loadSavedLHRs().length >= 0,
  },
  {
    label: 'Ancestor hash determinable',
    shouldTest: () => true,
    test: () => getAncestorHash().length > 0,
  },
  {
    id: 'githubToken',
    label: 'GitHub token set',
    // the test is opt-in via `githubToken` id
    shouldTest: () => true,
    test: opts => Boolean(opts.githubToken),
  },
  {
    label: 'LHCI server reachable',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => !!opts.serverBaseUrl,
    test: async ({serverBaseUrl = ''}) =>
      (await new ApiClient({rootURL: serverBaseUrl}).getVersion()).length > 0,
  },
  {
    label: 'LHCI server token valid',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async ({serverBaseUrl = '', token = ''}) => {
      const client = new ApiClient({rootURL: serverBaseUrl});
      const project = await client.findProjectByToken(token);
      return Boolean(project);
    },
  },
  {
    label: 'LHCI server unique build for this hash',
    // the test only makes sense if they've configured an LHCI server
    shouldTest: opts => Boolean(opts.serverBaseUrl && opts.token),
    test: async ({serverBaseUrl = '', token = ''}) => {
      const client = new ApiClient({rootURL: serverBaseUrl});
      const project = await client.findProjectByToken(token);
      if (!project) return true;
      const builds = await client.getBuilds(project.id, {hash: getCurrentHash()});
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
    allPassed = allPassed && (isWarn || result);
    process.stdout.write(`${icon}  ${check.label}${message}\n`);
  }

  if (allPassed) {
    process.stdout.write('Healthcheck passed!\n');
  } else {
    process.stdout.write('Healthcheck failed!\n');
    if (options.fatal) process.exit(1);
  }
}

module.exports = {buildCommand, runCommand};
