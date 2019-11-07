/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const _ = require('@lhci/utils/src/lodash.js');

const BUILD_DIR_PRIORITY = [
  // explicitly a dist version of the site, highly likely to be production assets
  // default name for vue-cli, parcel, and webpack
  'dist',
  // likely a built version of the site
  // default name for create-react-app and preact-cli
  'build',
  // riskier, sometimes is a built version of the site but also can be just a dir of static assets
  // default name for gatsby
  'public',
];

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    rcFile: {
      description: 'The lighthouserc.json file preferences.',
    },
    rcOverrides: {
      description:
        'Invididual flags to override the rc-file defaults. e.g. --rc-overrides.collect.numberOfRuns=5',
    },
  });
}

/** @param {string|undefined} rcFile @return {LHCI.LighthouseRc|undefined} */
function readRcFile(rcFile) {
  if (!rcFile) return undefined;
  const fullyResolvedPath = path.resolve(process.cwd(), rcFile);
  if (!fs.existsSync(fullyResolvedPath)) return undefined;
  return JSON.parse(fs.readFileSync(fullyResolvedPath, 'utf8'));
}

/**
 * @param {'collect'|'assert'|'upload'|'healthcheck'} command
 * @param {string[]} [args]
 * @return {{status: number}}
 */
function runChildCommand(command, args = []) {
  const combinedArgs = [process.argv[1], command, ...args, ...getOverrideArgsForCommand(command)];
  const {status = -1} = childProcess.spawnSync(process.argv[0], combinedArgs.filter(Boolean), {
    stdio: 'inherit',
  });

  process.stdout.write('\n');
  return {status: status || 0};
}

/** @return {string} */
function findBuildDir() {
  for (const dir of BUILD_DIR_PRIORITY) {
    const fullDirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDirPath)) continue;
    if (!fs.statSync(fullDirPath).isDirectory()) continue;
    const contents = fs.readdirSync(fullDirPath);
    if (contents.some(file => file.endsWith('.html'))) {
      process.stdout.write(`Automatically determined ./${dir} as \`buildDir\`.\n`);
      process.stdout.write(`Set it explicitly in lighthouserc.json if incorrect.\n\n`);
      return fullDirPath;
    }
  }

  throw new Error('Unable to determine `buildDir`; Set it explicitly in lighthouserc.json');
}

/** @return {string} */
function getStartServerCommandFlag() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) return '';

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const command = (packageJson.scripts && packageJson.scripts['serve:lhci']) || '';
  if (!command) return '';
  return `--start-server-command=${command}`;
}

/**
 * @param {'collect'|'assert'|'upload'|'healthcheck'} command
 */
function getOverrideArgsForCommand(command) {
  const argRegex = /^--rc(-)?overrides\.(collect|assert|upload|healthcheck)\./i;
  return process.argv
    .filter(arg => argRegex.test(arg))
    .filter(arg => arg.toLowerCase().includes(`overrides.${command}.`))
    .map(arg => arg.replace(argRegex, '--'));
}

/**
 * @param {LHCI.AutorunCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const rcFile = readRcFile(options.rcFile);
  if (rcFile && !rcFile.ci) throw new Error('RC file did not contain a root-level "ci" property');
  const ciConfiguration = (rcFile && rcFile.ci) || {};
  _.merge(ciConfiguration, options.rcOverrides || {});

  const defaultFlags = rcFile ? [`--rc-file=${options.rcFile}`] : [];
  let hasFailure = false;

  const healthcheckStatus = runChildCommand('healthcheck', [...defaultFlags, '--fatal']).status;
  if (healthcheckStatus !== 0) process.exit(healthcheckStatus);

  const collectHasUrlOrBuildDir =
    ciConfiguration.collect && (ciConfiguration.collect.url || ciConfiguration.collect.buildDir);
  const collectArgs = collectHasUrlOrBuildDir
    ? [getStartServerCommandFlag()]
    : [`--build-dir=${findBuildDir()}`];
  const collectStatus = runChildCommand('collect', [...defaultFlags, ...collectArgs]).status;
  if (collectStatus !== 0) process.exit(collectStatus);

  // We'll run assertions if there's assert options OR they haven't configured anything to do with the results
  if (ciConfiguration.assert || (!ciConfiguration.assert && !ciConfiguration.upload)) {
    const assertArgs = ciConfiguration.assert ? [] : [`--preset=lighthouse:recommended`];
    const assertStatus = runChildCommand('assert', [...defaultFlags, ...assertArgs]).status;
    hasFailure = assertStatus !== 0;
  }

  // We'll run upload only if they've configured the upload command
  if (ciConfiguration.upload) {
    const uploadStatus = runChildCommand('upload', defaultFlags).status;
    if (uploadStatus !== 0) process.exit(uploadStatus);
  }

  if (hasFailure) {
    process.stderr.write(`assert command failed. Exiting with status code 1.\n`);
    process.exit(1);
  }

  process.stderr.write(`Done running autorun.\n`);
}

module.exports = {buildCommand, runCommand};
