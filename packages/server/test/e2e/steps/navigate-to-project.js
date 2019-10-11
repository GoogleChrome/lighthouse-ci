/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {waitForNetworkIdle0, waitForAllImages} = require('../../test-utils.js');

/* eslint-env jest, browser */

module.exports = (state, projectName) => {
  describe('navigate to project', () => {
    it('should navigate to the project list', async () => {
      await Promise.all([state.page.goto(`${state.rootURL}/app`), waitForNetworkIdle0(state.page)]);
    });

    it('should click on link to project', async () => {
      const clickPromise = state.page.evaluate(name => {
        const links = [...document.querySelectorAll('a')];
        const matchingLink = links.find(link => link.textContent.includes(name));
        if (matchingLink) return matchingLink.click();
        throw new Error(`${links.map(link => link.textContent)} did not include ${name}`);
      }, projectName);

      await Promise.all([clickPromise, waitForNetworkIdle0(state.page)]);
      await waitForAllImages(state.page);
    });

    it('should wait for the dashboard to load', async () => {
      await state.page.waitFor('.dashboard');
      await state.page.waitFor('.dashboard-graph');
    });

    if (state.debug) {
      it(
        'should wait for the user to poke around',
        async () => {
          await new Promise(r => setTimeout(r, 5 * 60 * 1000));
        },
        5 * 60 * 1000
      );
    }
  });
};
