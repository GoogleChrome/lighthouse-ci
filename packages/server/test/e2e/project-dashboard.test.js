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
        return [...document.querySelectorAll('.dashboard__build-list tr')].map(
          row => row.textContent
        );
      });

      expect(commits).toMatchInlineSnapshot(`
        Array [
          "missing_ancestor (ba5b0ad9) 8:13:28 PM",
          "master (5b0ad9f6) 6:55:18 PM",
          "test_1 (c1ea447b) 6:15:28 PM",
        ]
      `);
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot()).toMatchImageSnapshot();
    });
  });

  require('./steps/teardown')(state);
});
