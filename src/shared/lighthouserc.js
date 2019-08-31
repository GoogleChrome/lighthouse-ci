/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('./lodash.js');

/** @typedef {Partial<LHCI.AssertCommand.Options & LHCI.CollectCommand.Options & LHCI.UploadCommand.Options & LHCI.ServerCommand.Options & {extends?: string | undefined}>} YargsOptions */

/**
 * @param {string} pathToRcFile
 * @return {YargsOptions}
 */
function loadAndParseRcFile(pathToRcFile) {
  const contents = fs.readFileSync(pathToRcFile, 'utf8');
  /** @type {LHCI.LighthouseRc} */
  const rcFile = JSON.parse(contents);
  return convertRcFileToYargsOptions(rcFile, pathToRcFile);
}

/**
 *
 * @param {LHCI.LighthouseRc} rcFile
 * @param {string} pathToRcFile
 * @return {YargsOptions}
 */
function convertRcFileToYargsOptions(rcFile, pathToRcFile) {
  const {ci = {}} = rcFile;
  /** @type {YargsOptions} */
  let merged = {...ci.assert, ...ci.collect, ...ci.upload, ...ci.server};
  if (ci.extends) {
    const extendedRcFilePath = path.resolve(path.dirname(pathToRcFile), ci.extends);
    const extensionBase = loadAndParseRcFile(extendedRcFilePath);
    merged = _.merge(extensionBase, merged);
  }

  return merged;
}

module.exports = {loadAndParseRcFile};
