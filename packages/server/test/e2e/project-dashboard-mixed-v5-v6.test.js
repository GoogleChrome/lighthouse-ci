/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const {shouldRunE2E, emptyTest} = require('../test-utils.js');

describe('Project dashboard', () => {
  if (!shouldRunE2E()) return emptyTest();

  const state = /** @type {LHCI.E2EState} */ ({dataset: 'actual'});

  require('./steps/setup')(state);

  require('./steps/navigate-to-project')(state, 'Lighthouse Real-World');

  describe('render the dashboard', () => {
    it('should show the commits', async () => {
      const commits = await state.page.evaluate(() => {
        return [...document.querySelectorAll('.dashboard-build-list tr')].map(
          row => row.textContent
        );
      });

      expect(commits).toMatchInlineSnapshot(`
        Array [
          "1240build 6call_splitmasterMay 16 6:00 AM",
          "1239build 5call_splitmasterMay 15 6:00 AM",
          "1238build 4call_splitmasterMay 14 6:00 AM",
          "1237build 3call_splitmasterMay 13 6:00 AM",
          "1236build 2call_splitmasterMay 12 6:00 AM",
        ]
      `);
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot({fullPage: true})).toMatchImageSnapshot();
    });

    it('should render graphs for previously unavailable data', async () => {
      const {height, left} = await state.page.evaluate(() => {
        const graphs = Array.from(document.querySelectorAll('.metric-line-graph__graph'));
        if (!graphs.length) throw new Error('Should have found 2 metric graphs');
        const {top, bottom, left} = graphs[1].getBoundingClientRect();
        window.scrollTo({top: top - 50});
        return {height: bottom - top, left};
      });

      await state.page.mouse.move(left * 1.5, 50 + height * 0.8);
      await state.page.waitFor(500);
    });

    it('should look correct on hover', async () => {
      expect(await state.page.screenshot({fullPage: false})).toMatchImageSnapshot();
    });
  });

  require('./steps/teardown')(state);
});
