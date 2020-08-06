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
const version = require('../../package.json').version;
const {
  loadRcFile,
  flattenRcToConfig,
  resolveRcFilePath,
} = require('@lhci/utils/src/lighthouserc.js');

const CONFIGURATION_DOCS_URL = `https://github.com/GoogleChrome/lighthouse-ci/blob/v${version}/docs/configuration.md`;

const BUILD_DIR_PRIORITY = [
  // explicitly a dist version of the site, highly likely to be production assets
  // default name for vue-cli, parcel, and webpack
  'dist',
  // likely a built version of the site
  // default name for create-react-app and preact-cli
  'build',
  // likely a built version of the site
  // default name for next.js
  'out',
  // riskier, sometimes is a built version of the site but also can be just a dir of static assets
  // default name for gatsby
  'public',
];

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    config: {description: 'The lighthouserc.json file preferences.'},
    failOnUploadFailure: {description: 'Exit with an error code if upload fails.', type: 'boolean'},
    collect: {description: 'Overrides for the collect command. e.g. --collect.numberOfRuns=5'},
    assert: {description: 'Overrides for the assert command. e.g. --assert.preset=lighthouse:all'},
    upload: {description: 'Overrides for the upload command. e.g. --upload.token=$TOKEN'},
  });
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
      process.stdout.write(`Automatically determined ./${dir} as \`staticDistDir\`.\n`);
      process.stdout.write(`Set it explicitly in lighthouserc.json if incorrect.\n\n`);
      return fullDirPath;
    }
  }

  process.stderr.write('\nERROR:\n');
  process.stderr.write('Unable to automatically determine the location of static site files.\n');
  process.stderr.write('Use the CLI flag --collect.staticDistDir or a lighthouserc config file ');
  process.stderr.write('to tell Lighthouse CI where your HTML files are located.\n');
  process.stderr.write(`Learn More: ${CONFIGURATION_DOCS_URL}\n\n`);
  throw new Error('Failed to automatically determine `staticDistDir`');
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
 * @param {string[]} [args]
 */
function getOverrideArgsForCommand(command, args = process.argv) {
  const argPrefix = `--${command}.`;
  return args
    .filter(arg => arg.startsWith(argPrefix) || /--no-?lighthouserc/i.test(arg))
    .map(arg => arg.replace(argPrefix, '--'));
}

/**
 * @param {LHCI.AutorunCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const rcFilePath = resolveRcFilePath(options.config);
  const rcFile = rcFilePath && loadRcFile(rcFilePath);
  const ciConfiguration = rcFile ? flattenRcToConfig(rcFile) : {};
  _.merge(ciConfiguration, _.pick(options, ['assert', 'collect', 'upload']));

  const defaultFlags = options.config ? [`--config=${options.config}`] : [];
  let hasFailure = false;

  const healthcheckStatus = runChildCommand('healthcheck', [...defaultFlags, '--fatal']).status;
  if (healthcheckStatus !== 0) process.exit(healthcheckStatus);

  const collectHasUrlOrBuildDir =
    ciConfiguration.collect &&
    (ciConfiguration.collect.url || ciConfiguration.collect.staticDistDir);
  const collectArgs = collectHasUrlOrBuildDir
    ? [getStartServerCommandFlag()]
    : [`--static-dist-dir=${findBuildDir()}`];
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
    if (options.failOnUploadFailure && uploadStatus !== 0) process.exit(uploadStatus);
    if (uploadStatus !== 0) process.stderr.write(`WARNING: upload command failed.\n`);
  }

  if (hasFailure) {
    process.stderr.write(`assert command failed. Exiting with status code 1.\n`);
    process.exit(1);
  }

  process.stdout.write(`Done running autorun.\n`);
}

module.exports = {buildCommand, runCommand, getOverrideArgsForCommand};
