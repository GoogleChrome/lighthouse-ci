/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as path from 'path';
import initStoryshots_ from '@storybook/addon-storyshots';
import {imageSnapshot} from '@storybook/addon-storyshots-puppeteer';

let initStoryshots = initStoryshots_;

if (process.env.CI && require('os').platform() !== 'darwin') {
  initStoryshots = () => {
    describe('Storyshots', () => {
      it.skip('disabled in travis on non-mac for subtle font rendering issues', () => {
        expect(true).toBe(false);
      });
    });
  };
}

initStoryshots({
  configPath: path.join(__dirname, '../../.storybook'),
  suite: 'Image Storyshots',
  test: imageSnapshot({
    storybookUrl: `http://localhost:${process.env.STORYBOOK_PORT}`,
    beforeScreenshot: async (page) => {
      // The browser is reused, so set the viewport back to a good default.
      await page.setViewport({width: 800, height: 600});

      // TODO: replace with "wait for network idle" when puppeteer upgrades
      await page.waitFor(2000);

      const dimensions = await page.evaluate(() => {
        // Note: #root is made by storybook, #storybook-test-root is made by us in preview.jsx
        // #root > #storybook-test-root > some_element_being_tested
        
        // Some snapshots (like Audit Detail Pane) are position fixed, which doesn't
        // display properly and so is overriden with absolute (ctrl+f "#storybook-test-root").
        // That makes the #root element not contain the full size of its children.
        // In that case, we look at the tested component directly.
        let element;
        if (document.querySelector('#storybook-test-root').clientWidth === 0) {
          element = document.querySelector('#storybook-test-root').children[0];
        } else {
          // Simplest case is just to return the size of the #root element.
          // We could just do the former branch for this case too. This is really
          // only here to better document what this code is doing.
          element = document.querySelector('#root');
        }

        return {
          width: Math.ceil(element.clientWidth),
          height: Math.ceil(element.clientHeight),
        };
      });
      await page.setViewport(dimensions);
      await page.evaluate(() => new Promise(r => window.requestAnimationFrame(r)));
    },
    getMatchOptions: () => ({
      failureThreshold: process.env.CI ? 0.005 : 0.0015,
      failureThresholdType: 'percent',
    }),
    getScreenshotOptions: () => ({
      encoding: 'base64',
    }),
  }),
});
