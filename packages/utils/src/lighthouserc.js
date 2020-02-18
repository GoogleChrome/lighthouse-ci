/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('./lodash.js');

const RC_FILE_NAMES = [
  '.lighthouserc.js',
  'lighthouserc.js',
  '.lighthouserc.json',
  'lighthouserc.json',
  '.lighthouserc.yml',
  'lighthouserc.yml',
  '.lighthouserc.yaml',
  'lighthouserc.yaml',
];

const JS_FILE_EXTENSION_REGEX = /\.(js)$/i;
const YAML_FILE_EXTENSION_REGEX = /\.(yml|yaml)$/i;

/**
 * Yargs will treat any key with a `.` in the name as a specifier for an object subpath.
 * This isn't the behavior we want when using the `config` file, just the CLI arguments, so we rename.
 * Anything that has `.` to `:` and avoid using any keys with `.` in the name throughout LHCI.
 * This fixes a bug where assertions used `.` in the name but now optionally use `:` as well.
 * @see https://github.com/GoogleChrome/lighthouse-ci/issues/64
 * @param {any} object
 */
function recursivelyReplaceDotInKeyName(object) {
  if (typeof object !== 'object' || !object) return;
  for (const [key, value] of Object.entries(object)) {
    recursivelyReplaceDotInKeyName(value);
    if (!key.includes('.')) continue;
    delete object[key];
    object[key.replace(/\./g, ':')] = value;
  }
}

/**
 * @param {string} pathToRcFile
 * @return {LHCI.YargsOptions}
 */
function loadAndParseRcFile(pathToRcFile) {
  return convertRcFileToYargsOptions(loadRcFile(pathToRcFile), pathToRcFile);
}

/**
 * Load file, parse and convert all `.` in key names to `:`
 * @param {string} pathToRcFile
 * @return {LHCI.LighthouseRc}
 */
function loadRcFile(pathToRcFile) {
  // Load file
  const contents = fs.readFileSync(pathToRcFile, 'utf8');
  const rc = parseFileContentToJSON(pathToRcFile, contents);
  // Convert all `.` in key names to `:`
  recursivelyReplaceDotInKeyName(rc);
  return rc;
}

/**
 * Parse file content to JSON.
 * @param {string} pathToRcFile
 * @param {string} contents
 * @return {LHCI.LighthouseRc}
 */
function parseFileContentToJSON(pathToRcFile, contents) {
  // Check if file path ends in .js
  if (JS_FILE_EXTENSION_REGEX.test(pathToRcFile)) {
    return require(pathToRcFile);
  }

  // Check if file path ends in .yaml or .yml
  if (YAML_FILE_EXTENSION_REGEX.test(pathToRcFile)) {
    // Parse yaml content to JSON
    return yaml.safeLoad(contents);
  }

  // Fallback to JSON parsing
  return JSON.parse(contents);
}

/**
 * @param {string} dir
 * @return {string|undefined}
 */
function findRcFileInDirectory(dir) {
  for (const file of RC_FILE_NAMES) {
    if (fs.existsSync(path.join(dir, file))) return path.join(dir, file);
  }
}

/**
 * @param {string} [startDir]
 * @param {{recursive?: boolean}} [opts]
 * @return {string|undefined}
 */
function findRcFile(startDir, opts = {}) {
  const {recursive = false} = opts;
  let lastDir = '';
  let dir = startDir || process.cwd();
  if (!recursive) return findRcFileInDirectory(dir);

  while (lastDir.length !== dir.length) {
    const rcFile = findRcFileInDirectory(dir);
    if (rcFile) return rcFile;
    lastDir = dir;
    dir = path.join(dir, '..');
  }
}

/**
 * @param {string[]} [argv]
 * @param {Record<string, string|undefined>} [env]
 * @return {boolean}
 */
function hasOptedOutOfRcDetection(argv = process.argv, env = process.env) {
  if (env.LHCI_NO_LIGHTHOUSERC) return true;
  if (argv.some(arg => /no-?lighthouserc/i.test(arg))) return true;
  return false;
}

/**
 *
 * @param {LHCI.LighthouseRc} rcFile
 * @param {string} pathToRcFile
 * @return {LHCI.YargsOptions}
 */
function convertRcFileToYargsOptions(rcFile, pathToRcFile) {
  const ci = flattenRcToConfig(rcFile);
  /** @type {LHCI.YargsOptions} */
  let merged = {...ci.wizard, ...ci.assert, ...ci.collect, ...ci.upload, ...ci.server};
  if (ci.extends) {
    const extendedRcFilePath = path.resolve(path.dirname(pathToRcFile), ci.extends);
    const extensionBase = loadAndParseRcFile(extendedRcFilePath);
    merged = _.merge(extensionBase, merged);
  }

  return merged;
}

/**
 *
 * @param {LHCI.LighthouseRc} rc
 * @return {LHCI.LighthouseCiConfig}
 */
function flattenRcToConfig(rc) {
  return {
    ...(rc.ci || {}),
    ...(rc.lhci || {}),
    ..._.omit(rc['ci:client'] || {}, ['server']),
    ..._.pick(rc['ci:server'] || {}, ['server']),
  };
}

/**
 * @param {string|undefined} pathToRcFile
 * @return {string|undefined}
 */
function resolveRcFilePath(pathToRcFile) {
  if (typeof pathToRcFile === 'string') return path.resolve(process.cwd(), pathToRcFile);
  return hasOptedOutOfRcDetection() ? undefined : findRcFile();
}

// AFAIK this can't be expressed in JSDoc yet, so fallback to coercive typedef
// @see https://github.com/microsoft/TypeScript/issues/24929
/** @typedef {((s: string) => string) & ((s: undefined) => string|undefined) & ((s: string|undefined) => string|undefined)} ResolveRcFilePathTrueType */

module.exports = {
  loadRcFile,
  loadAndParseRcFile,
  findRcFile,
  resolveRcFilePath: /** @type {ResolveRcFilePathTrueType} */ (resolveRcFilePath),
  flattenRcToConfig,
  hasOptedOutOfRcDetection,
};
