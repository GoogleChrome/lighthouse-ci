/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

describe('Project dashboard', () => {
  const state = {};

  require('./steps/setup')(state);

  require('./steps/navigate-to-project')(state, 'Lighthouse Viewer');

  describe('render the dashboard', () => {
    it('should show the commits', async () => {
      const commits = await state.page.evaluate(() => {
        return [...document.querySelectorAll('.dashboard__build-list tr')]
          .map(row => row.textContent.replace(/\d+:\d+:\d+ (AM|PM)/, 'DATETIME'))
          .sort();
      });

      expect(commits).toMatchInlineSnapshot(`
        Array [
          "master (bb9aa3c1) DATETIME",
          "test_0 (aaa5b0a3) DATETIME",
          "test_1 (c1ea447b) DATETIME",
        ]
      `);
    });
  });

  require('./steps/teardown')(state);
});
