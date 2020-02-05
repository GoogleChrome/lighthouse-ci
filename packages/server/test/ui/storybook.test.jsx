/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as path from 'path';
import initStoryshots from '@storybook/addon-storyshots';
import {imageSnapshot} from '@storybook/addon-storyshots-puppeteer';

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;

initStoryshots({
  configPath: path.join(__dirname, '../../.storybook'),
  suite: 'Image Storyshots',
  test: imageSnapshot({
    storybookUrl: `http://localhost:${process.env.STORYBOOK_PORT}`,
    beforeScreenshot: async (page, options) => {
      const parameters = options.context.parameters;
      const {width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT} = parameters.dimensions || {};
      await page.setViewport({width, height});
    },
    getMatchOptions: () => ({
      // FIXME: we're more forgiving in Travis where font rendering on linux creates small changes
      failureThreshold: process.env.TRAVIS && require('os').platform() !== 'darwin' ? 0.05 : 0.001,
      failureThresholdType: 'percent',
    }),
  }),
});
