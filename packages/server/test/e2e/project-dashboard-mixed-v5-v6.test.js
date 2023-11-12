/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */
/* eslint-disable no-irregular-whitespace */

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
        [
          "1250build 16call_splitmasterMay 26 6:00 AM",
          "1249build 15call_splitmasterMay 25 6:00 AM",
          "1248build 14call_splitmasterMay 24 6:00 AM",
          "1247build 13call_splitmasterMay 23 6:00 AM",
          "1246build 12call_splitmasterMay 22 6:00 AM",
        ]
      `);
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot({fullPage: true})).toMatchImageSnapshot();
    });

    it('should render graphs for previously unavailable data', async () => {
      await state.page.evaluate(() => {
        const graphs = Array.from(document.querySelectorAll('.metric-line-graph__graph'));
        if (graphs.length !== 2) throw new Error('Should have found 2 metric graphs');

        window.scrollTo({top: graphs[0].getBoundingClientRect().top - 50});
        return new Promise(resolve => requestAnimationFrame(resolve));
      });

      // Hover the first graph.
      await state.page.mouse.move(200, 200);
    });

    it('should look correct on hover', async () => {
      expect(await state.page.screenshot({fullPage: false})).toMatchImageSnapshot();
    });
  });

  require('./steps/teardown')(state);
});
