/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('./lodash.js');

// prettier-ignore
const RC_FILE_NAMES = [
  '.lighthouserc.json',
  'lighthouserc.json',
];

/**
 * @param {string} pathToRcFile
 * @return {LHCI.YargsOptions}
 */
function loadAndParseRcFile(pathToRcFile) {
  return convertRcFileToYargsOptions(loadRcFile(pathToRcFile), pathToRcFile);
}

/**
 * @param {string} pathToRcFile
 * @return {LHCI.LighthouseRc}
 */
function loadRcFile(pathToRcFile) {
  const contents = fs.readFileSync(pathToRcFile, 'utf8');
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
  const {ci = {}} = rcFile;
  /** @type {LHCI.YargsOptions} */
  let merged = {...ci.assert, ...ci.collect, ...ci.upload, ...ci.server};
  if (ci.extends) {
    const extendedRcFilePath = path.resolve(path.dirname(pathToRcFile), ci.extends);
    const extensionBase = loadAndParseRcFile(extendedRcFilePath);
    merged = _.merge(extensionBase, merged);
  }

  return merged;
}

/** @param {string|undefined} pathToRcFile */
function resolveRcFilePath(pathToRcFile) {
  if (pathToRcFile) return pathToRcFile;
  return hasOptedOutOfRcDetection() ? undefined : findRcFile();
}

module.exports = {
  loadRcFile,
  loadAndParseRcFile,
  findRcFile,
  resolveRcFilePath,
  hasOptedOutOfRcDetection,
};
