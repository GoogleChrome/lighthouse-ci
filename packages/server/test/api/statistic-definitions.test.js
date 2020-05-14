/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

/** @type {any} */
const baseLhr5_ = require('../fixtures/lh-5-6-0-verge-a.json');
/** @type {any} */
const baseLhr6_ = require('../fixtures/lh-6-0-0-coursehero-a.json');
const {definitions} = require('../../src/api/statistic-definitions.js');

describe('Statistic Definitions', () => {
  /** @type {LH.Result} */
  const baseLhr5 = baseLhr5_;
  /** @type {LH.Result} */
  const baseLhr6 = baseLhr6_;

  describe('metaLighthouseVersion()', () => {
    const run = definitions.meta_lighthouse_version;

    it('should extract the version', () => {
      expect(run([baseLhr5])).toEqual({value: 50600});
      expect(run([baseLhr6])).toEqual({value: 60000});
      expect(run([{...baseLhr5, lighthouseVersion: '1.2.3-beta.0'}])).toEqual({value: 10203});
    });

    it('should fallback to 0 for bad versions', () => {
      expect(run([{...baseLhr5, lighthouseVersion: 'empty'}])).toEqual({value: 0});
      expect(run([{...baseLhr5, lighthouseVersion: '5.6'}])).toEqual({value: 0});
    });
  });
});
