/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {createTestServer, launchBrowser, setupImageSnapshots} = require('../../test-utils.js');

setupImageSnapshots();

/** @param {LHCI.E2EState} state */
module.exports = state => {
  state.debug = Boolean(process.env.DEBUG);

  describe('initialize', () => {
    it('should initialize a server', async () => {
      state.server = await createTestServer();
      state.rootURL = `http://localhost:${state.server.port}`;
    });

    it('should initialize a browser', () => launchBrowser(state));
  });
};
