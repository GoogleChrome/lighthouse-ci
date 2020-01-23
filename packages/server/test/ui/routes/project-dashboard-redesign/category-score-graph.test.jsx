/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {
  computeScoreLineSegments,
  buildMinMaxByBuildId,
} from '../../../../src/ui/routes/project-dashboard-redesign/category-score-graph';
import {cleanup} from '../../../test-utils.js';

afterEach(cleanup);

describe('Category Score Graph', () => {
  describe('computeScoreLineSegments', () => {
    it('should return the line segments to be colored', () => {
      const pass = {value: 0.95};
      const average = {value: 0.75};
      const fail = {value: 0.25};
      const statistics = [pass, fail, fail, fail, average, fail, pass, pass, average];
      const segments = computeScoreLineSegments(statistics);
      expect(segments).toEqual([
        [pass, fail, fail, fail],
        [fail, average],
        [average, fail],
        [fail, pass, pass],
        [pass, average],
      ]);
    });

    it('should handle score class and not exact score', () => {
      const statistics = [{score: 0.13}, {score: 0.22}, {score: 0.48}, {score: 0.05}];
      const segments = computeScoreLineSegments(statistics);
      expect(segments).toEqual([statistics]);
    });
  });

  describe('buildMinMaxByBuildId', () => {
    it('should set the min/max values by build id', () => {
      const statistics = [
        {buildId: 'a', name: 'category_pwa_average', value: 0.4},
        {buildId: 'a', name: 'category_pwa_min', value: 0.1},
        {buildId: 'a', name: 'category_pwa_max', value: 0.7},
        {buildId: 'b', name: 'category_pwa_min', value: 0.6},
        {buildId: 'b', name: 'category_pwa_average', value: 0.8},
        {buildId: 'b', name: 'category_pwa_max', value: 0.99},
      ];

      expect(buildMinMaxByBuildId(statistics)).toEqual({
        a: {min: 0.1, max: 0.7},
        b: {min: 0.6, max: 0.99},
      });
    });
  });
});
