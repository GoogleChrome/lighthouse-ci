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
/** @type {any} */
const baseLhr62_ = require('../fixtures/lh-6-2-0-coursehero-a.json');
const {definitions} = require('../../src/api/statistic-definitions.js');

describe('Statistic Definitions', () => {
  /** @type {LH.Result} */
  const baseLhr5 = baseLhr5_;
  /** @type {LH.Result} */
  const baseLhr6 = baseLhr6_;
  /** @type {LH.Result} */
  const baseLhr62 = baseLhr62_;

  describe('meta_lighthouse_version()', () => {
    const run = definitions.meta_lighthouse_version;

    it('should extract the version', () => {
      expect(run([baseLhr5])).toEqual({value: 50600});
      expect(run([baseLhr6])).toEqual({value: 60000});
      expect(run([baseLhr62])).toEqual({value: 60200});
      expect(run([{...baseLhr5, lighthouseVersion: '1.2.3-beta.0'}])).toEqual({value: 10203});
    });

    it('should fallback to 0 for bad versions', () => {
      expect(run([{...baseLhr5, lighthouseVersion: 'empty'}])).toEqual({value: 0});
      expect(run([{...baseLhr5, lighthouseVersion: '5.6'}])).toEqual({value: 0});
    });
  });

  describe('audit_interactive_median()', () => {
    const run = definitions.audit_interactive_median;

    it('should extract the median value', () => {
      const low = JSON.parse(JSON.stringify(baseLhr5));
      const high = JSON.parse(JSON.stringify(baseLhr5));
      low.audits.interactive.numericValue = 1e3;
      high.audits.interactive.numericValue = 100e3;
      expect(run([low, high, baseLhr5]).value).toBeCloseTo(43223.58);
      expect(run([baseLhr6, low, high]).value).toBeCloseTo(20253.43);
      expect(run([high, baseLhr62, low]).value).toBeCloseTo(19669.83);
    });
  });

  describe('category_performance_median()', () => {
    const run = definitions.category_performance_median;

    it('should extract the median value', () => {
      const low = JSON.parse(JSON.stringify(baseLhr5));
      const high = JSON.parse(JSON.stringify(baseLhr5));
      low.categories.performance.score = 0.01;
      high.categories.performance.score = 0.99;
      expect(run([low, high, baseLhr5]).value).toBeCloseTo(0.18);
      expect(run([baseLhr6, low, high]).value).toBeCloseTo(0.16);
      expect(run([high, baseLhr62, low]).value).toBeCloseTo(0.28);
    });
  });

  describe('category_performance_min()', () => {
    const run = definitions.category_performance_min;

    it('should extract the min value', () => {
      const low = JSON.parse(JSON.stringify(baseLhr5));
      const high = JSON.parse(JSON.stringify(baseLhr5));
      low.categories.performance.score = 0.01;
      high.categories.performance.score = 0.99;
      expect(run([low, high, baseLhr5]).value).toBeCloseTo(0.01);
      expect(run([baseLhr6, low, high]).value).toBeCloseTo(0.01);
      expect(run([high, baseLhr62, low]).value).toBeCloseTo(0.01);
    });
  });

  describe('category_performance_max()', () => {
    const run = definitions.category_performance_max;

    it('should extract the max value', () => {
      const low = JSON.parse(JSON.stringify(baseLhr5));
      const high = JSON.parse(JSON.stringify(baseLhr5));
      low.categories.performance.score = 0.01;
      high.categories.performance.score = 0.99;
      expect(run([low, high, baseLhr5]).value).toBeCloseTo(0.99);
      expect(run([baseLhr6, low, high]).value).toBeCloseTo(0.99);
      expect(run([high, baseLhr62, low]).value).toBeCloseTo(0.99);
    });
  });

  describe('auditgroup_a11y-aria_*()', () => {
    it('should extract the group count', () => {
      expect(definitions['auditgroup_a11y-aria_pass']([baseLhr5])).toEqual({value: 7});
      expect(definitions['auditgroup_a11y-aria_pass']([baseLhr6])).toEqual({value: 10});
      expect(definitions['auditgroup_a11y-aria_pass']([baseLhr62])).toEqual({value: 10});
      expect(definitions['auditgroup_a11y-color-contrast_fail']([baseLhr5])).toEqual({value: 0});
      expect(definitions['auditgroup_a11y-color-contrast_fail']([baseLhr6])).toEqual({value: 1});
      expect(definitions['auditgroup_a11y-color-contrast_fail']([baseLhr62])).toEqual({value: 1});
      expect(definitions['auditgroup_a11y-aria_na']([baseLhr5])).toEqual({value: 0});
      expect(definitions['auditgroup_a11y-aria_na']([baseLhr6])).toEqual({value: 2});
      expect(definitions['auditgroup_a11y-aria_na']([baseLhr62])).toEqual({value: 2});
    });
  });
});
