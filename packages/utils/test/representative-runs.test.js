/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {computeRepresentativeRuns} = require('../src/representative-runs.js');

describe('Representative Runs', () => {
  function lhr(auditNumericValues) {
    const audits = {};
    for (const [id, numericValue] of Object.entries(auditNumericValues)) {
      audits[id] = {numericValue};
    }

    return {audits};
  }

  describe('#computeRepresentativeRuns', () => {
    it('should pick the median run of each set', () => {
      const runs = [
        [
          [{id: 1}, lhr({interactive: 100, 'first-contentful-paint': 100})],
          [{id: 2}, lhr({interactive: 200, 'first-contentful-paint': 200})],
          [{id: 3}, lhr({interactive: 300, 'first-contentful-paint': 300})],
          [{id: 4}, lhr({interactive: 400, 'first-contentful-paint': 400})],
          [{id: 5}, lhr({interactive: 500, 'first-contentful-paint': 500})],
        ],
        [
          [{id: 6}, lhr({interactive: 100, 'first-contentful-paint': 100})],
          [{id: 7}, lhr({interactive: 200, 'first-contentful-paint': 200})],
          [{id: 8}, lhr({interactive: 300, 'first-contentful-paint': 300})],
        ],
      ];

      expect(computeRepresentativeRuns(runs)).toEqual([{id: 3}, {id: 7}]);
    });

    it('should avoid FCP outliers', () => {
      const runs = [
        [
          [{id: 1}, lhr({interactive: 100, 'first-contentful-paint': 100})],
          [{id: 2}, lhr({interactive: 250, 'first-contentful-paint': 400})],
          [{id: 3}, lhr({interactive: 300, 'first-contentful-paint': 10000})],
          [{id: 4}, lhr({interactive: 400, 'first-contentful-paint': 400})],
          [{id: 5}, lhr({interactive: 500, 'first-contentful-paint': 500})],
        ],
      ];

      expect(computeRepresentativeRuns(runs)).toEqual([{id: 2}]);
    });

    it('should avoid TTI outliers', () => {
      const runs = [
        [
          [{id: 1}, lhr({interactive: 100, 'first-contentful-paint': 100})],
          [{id: 2}, lhr({interactive: 200, 'first-contentful-paint': 200})],
          [{id: 3}, lhr({interactive: 10000, 'first-contentful-paint': 300})],
          [{id: 4}, lhr({interactive: 300, 'first-contentful-paint': 400})],
          [{id: 5}, lhr({interactive: 500, 'first-contentful-paint': 500})],
        ],
      ];

      expect(computeRepresentativeRuns(runs)).toEqual([{id: 4}]);
    });

    it('should support empty arrays', () => {
      expect(computeRepresentativeRuns([])).toEqual([]);
      expect(computeRepresentativeRuns([[], []])).toEqual([]);
    });
  });
});
