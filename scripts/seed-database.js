#!/usr/bin/env node
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {loadAndParseRcFile, resolveRcFilePath} = require('../packages/utils/src/lighthouserc.js');
const ApiClient = require('../packages/utils/src/api-client.js');
const {writeSeedDataToApi} = require('../packages/utils/src/seed-data/seed-data.js');
const {createActualTestDataset} = require('../packages/server/test/test-utils.js');
const {
  createDefaultDataset,
  createLoadTestDataset,
} = require('../packages/utils/src/seed-data/dataset-generator.js');

if (process.argv.length !== 3 && process.argv.length !== 4) {
  process.stderr.write(`Usage ./scripts/seed-database.js <path to rc file> [--load]`);
  process.exit(1);
}

async function run() {
  const {serverBaseUrl} = loadAndParseRcFile(resolveRcFilePath(process.argv[2]));
  if (!serverBaseUrl) throw new Error('RC file did not set the serverBaseUrl');

  const api = new ApiClient({rootURL: serverBaseUrl});
  await writeSeedDataToApi(
    api,
    process.argv.includes('--load')
      ? createLoadTestDataset()
      : process.argv.includes('--actual')
      ? createActualTestDataset()
      : createDefaultDataset()
  );
}

run();
