/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FallbackServer = require('../../cli/src/collect/fallback-server.js');

module.exports = {
  ...require('../../server/test/test-utils.js'),
  createTestServer: async () => {
    const pathToBuildDir = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(`${pathToBuildDir}/index.html`)) {
      throw new Error('Build viewer before running tests');
    }

    const server = new FallbackServer(pathToBuildDir, false);
    await server.listen();
    return server;
  },
};
