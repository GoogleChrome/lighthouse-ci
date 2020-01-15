/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const {shouldRunE2E, emptyTest, getTestLHRPath, waitForNetworkIdle0} = require('../test-utils.js');

describe('Viewer simple comparison', () => {
  if (!shouldRunE2E()) return emptyTest();

  const state = /** @type {LHCI.E2EState} */ ({});

  require('./steps/setup')(state);

  describe('render the landing route', () => {
    it('should navigate to the page', async () => {
      await Promise.all([state.page.goto(state.rootURL), waitForNetworkIdle0(state.page)]);
    });

    it('should upload the first report', async () => {
      const baseUpload = await state.page.$('.report-upload-box--base input[type=file]');
      if (!baseUpload) throw new Error('Missing base upload box');

      await baseUpload.uploadFile(getTestLHRPath('5.6.0', 'verge', 'a'));
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot()).toMatchImageSnapshot();
    });

    it('should upload the second report', async () => {
      const compareUpload = await state.page.$('.report-upload-box--compare input[type=file]');
      if (!compareUpload) throw new Error('Missing compare upload box');

      await compareUpload.uploadFile(getTestLHRPath('5.6.0', 'verge', 'b'));
    });
  });

  describe('render the comparison route', () => {
    it('should wait for the diff to render', async () => {
      await Promise.all([waitForNetworkIdle0(state.page), state.page.waitFor('.lhr-comparison')]);
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot()).toMatchImageSnapshot();
    });
  });

  require('./steps/teardown')(state);
});
