/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const lighthouseAllPreset = require('@lhci/utils/src/presets/all.js');
const {convertBudgetsToAssertions} = require('@lhci/utils/src/budgets-converter.js');
const {getAllAssertionResults} = require('@lhci/utils/src/assertions.js');

describe('getAllAssertionResults', () => {
  let lhrs;

  beforeEach(() => {
    lhrs = [
      {
        finalUrl: 'http://page-1.com',
        audits: {
          'first-contentful-paint': {
            score: 0.6,
          },
          'speed-index': {
            numericValue: 5000,
          },
          'network-requests': {
            score: 0,
            details: {items: [1, 2, 3, 4]},
          },
        },
      },
      {
        finalUrl: 'http://page-1.com',
        audits: {
          'first-contentful-paint': {
            score: 0.8,
          },
          'speed-index': {
            numericValue: 5500,
          },
          'network-requests': {
            score: 0,
            details: {items: [1, 2]},
          },
        },
      },
    ];
  });

  it('should fail on assertion for audit that did not run', () => {
    const assertions = {missing: 'error'};
    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toEqual([
      {
        url: 'http://page-1.com',
        actual: 0,
        auditId: 'missing',
        expected: 1,
        level: 'error',
        name: 'auditRan',
        operator: '>=',
        values: [0, 0],
      },
    ]);
  });

  it('should pass assertions', () => {
    const assertions = {
      'first-contentful-paint': ['error', {minScore: 0.5}],
      'network-requests': ['warn', {maxLength: 10}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toEqual([]);
  });

  it('should assert failures', () => {
    const assertions = {
      'first-contentful-paint': ['error', {minScore: 0.9}],
      'network-requests': ['warn', {maxLength: 1}],
      'speed-index': ['error', {maxNumericValue: 2000}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toEqual([
      {
        url: 'http://page-1.com',
        actual: 0.8,
        auditId: 'first-contentful-paint',
        expected: 0.9,
        level: 'error',
        name: 'minScore',
        operator: '>=',
        values: [0.6, 0.8],
      },
      {
        url: 'http://page-1.com',
        actual: 2,
        auditId: 'network-requests',
        expected: 1,
        level: 'warn',
        name: 'maxLength',
        operator: '<=',
        values: [4, 2],
      },
      {
        url: 'http://page-1.com',
        actual: 5000,
        auditId: 'speed-index',
        expected: 2000,
        level: 'error',
        name: 'maxNumericValue',
        operator: '<=',
        values: [5000, 5500],
      },
    ]);
  });

  it('should use minScore = 1 by default', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic'}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toMatchObject([{actual: 0.8, expected: 1}]);
  });

  it('should respect notApplicable', () => {
    const assertions = {
      'network-requests': 'error',
    };

    lhrs[0].audits['network-requests'].score = null;
    lhrs[1].audits['network-requests'].score = null;
    lhrs[0].audits['network-requests'].scoreDisplayMode = 'notApplicable';
    lhrs[1].audits['network-requests'].scoreDisplayMode = 'notApplicable';
    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toEqual([]);
  });

  it('should respect informative', () => {
    const assertions = {
      'network-requests': 'error',
    };

    lhrs[0].audits['network-requests'].score = null;
    lhrs[1].audits['network-requests'].score = null;
    lhrs[0].audits['network-requests'].scoreDisplayMode = 'informative';
    lhrs[1].audits['network-requests'].scoreDisplayMode = 'informative';
    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toMatchObject([{actual: 0, expected: 1, name: 'minScore'}]);
  });

  it('should de-dupe camelcase audits', () => {
    const assertions = {
      firstContentfulPaint: ['warn', {aggregationMethod: 'optimistic', minScore: 1}],
      'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic', minScore: 1}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toMatchObject([{actual: 0.8}]);
  });

  describe('aggregationMethod', () => {
    it('should default to aggregationMethod optimistic', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {minScore: 1}],
        'network-requests': ['warn', {maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.8}, {actual: 2}]);
    });

    it('should use aggregationMethod optimistic', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic', minScore: 1}],
        'network-requests': ['warn', {aggregationMethod: 'optimistic', maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.8}, {actual: 2}]);
    });

    it('should use aggregationMethod pessimistic', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'pessimistic', minScore: 1}],
        'network-requests': ['warn', {aggregationMethod: 'pessimistic', maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.6}, {actual: 4}]);
    });

    it('should use aggregationMethod median', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'median', minScore: 1}],
        'network-requests': ['warn', {aggregationMethod: 'median', maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.7}, {actual: 3}]);
    });

    it('should use aggregationMethod median-run', () => {
      const lhrs = [
        // This is the "median-run" by FCP and interactive.
        {
          finalUrl: 'http://example.com',
          audits: {
            'first-contentful-paint': {numericValue: 5000},
            interactive: {numericValue: 10000},
            'other-audit': {numericValue: 23000},
          },
        },
        {
          finalUrl: 'http://example.com',
          audits: {
            'first-contentful-paint': {numericValue: 1000},
            interactive: {numericValue: 5000},
            'other-audit': {numericValue: 5000},
          },
        },
        {
          finalUrl: 'http://example.com',
          audits: {
            'first-contentful-paint': {numericValue: 10000},
            interactive: {numericValue: 15000},
            'other-audit': {numericValue: 2000},
          },
        },
      ];

      const assertions = {
        'other-audit': ['warn', {aggregationMethod: 'median-run', maxNumericValue: 10000}],
      };

      const results = getAllAssertionResults({assertions}, lhrs);
      // The assertion should use the median run, not the median of the values.
      expect(results).toEqual([
        {
          level: 'warn',
          auditId: 'other-audit',
          actual: 23000,
          expected: 10000,
          name: 'maxNumericValue',
          operator: '<=',
          url: 'http://example.com',
          values: [23000],
        },
      ]);
    });

    it('should use file-wide default when set', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {minScore: 1}],
        'network-requests': ['warn', {maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions, aggregationMethod: 'pessimistic'}, lhrs);
      expect(results).toMatchObject([{actual: 0.6}, {actual: 4}]);
    });

    it('should override file-wide default when set', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {minScore: 1, aggregationMethod: 'pessimistic'}],
        'network-requests': ['warn', {maxLength: 1}],
      };

      const results = getAllAssertionResults({assertions, aggregationMethod: 'median'}, lhrs);
      expect(results).toMatchObject([{actual: 0.6}, {actual: 3}]);
    });

    it('should handle partial failure with mode optimistic', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic'}],
      };

      lhrs[1].audits['first-contentful-paint'].score = null;
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.6, expected: 1, name: 'minScore'}]);
    });

    it('should handle partial failure with mode median', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'median'}],
      };

      lhrs[1].audits['first-contentful-paint'].score = null;
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.6, expected: 1, name: 'minScore'}]);
    });

    it('should handle partial failure when mode is pessimistic', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'pessimistic'}],
      };

      lhrs[1].audits['first-contentful-paint'].score = null;
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0, expected: 1, name: 'auditRan'}]);
    });
  });

  describe('presets', () => {
    const auditIds = Object.keys(lighthouseAllPreset.assertions).filter(
      id => lighthouseAllPreset.assertions[id][0] !== 'off'
    );

    beforeEach(() => {
      const lhrA = {audits: {}};
      const lhrB = {audits: {}};
      for (const auditId of auditIds) {
        lhrA.audits[auditId] = {score: 0.5};
        lhrB.audits[auditId] = {score: 0.7};
      }

      lhrs = [lhrA, lhrB];
    });

    it('should use the preset with changes', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'pessimistic', minScore: 0.6}],
      };

      const results = getAllAssertionResults({preset: 'lighthouse:all', assertions}, lhrs);
      expect(results).toHaveLength(auditIds.length);

      for (const result of results) {
        if (result.auditId === 'first-contentful-paint') {
          expect(result).toMatchObject({level: 'warn', expected: 0.6, actual: 0.5});
        } else {
          expect(result).toMatchObject({level: 'error', expected: 1, actual: 0.7});
        }
      }
    });

    it('should use the preset as-is', () => {
      const results = getAllAssertionResults({preset: 'lighthouse:all'}, lhrs);
      expect(results).toHaveLength(auditIds.length);

      for (const result of results) {
        expect(result).toMatchObject({
          level: 'error',
          expected: 1,
          actual: 0.7,
          values: [0.5, 0.7],
        });
      }
    });
  });

  describe('budgets', () => {
    let lhrWithBudget;
    let lhrWithResourceSummary;

    beforeEach(() => {
      lhrWithBudget = {
        finalUrl: 'http://page-1.com',
        audits: {
          'performance-budget': {
            id: 'performance-budget',
            score: null,
            scoreDisplayMode: 'informative',
            details: {
              type: 'table',
              items: [
                {
                  resourceType: 'document',
                  label: 'Document',
                  requestCount: 1,
                  size: 3608,
                  sizeOverBudget: 2584,
                },
                {
                  resourceType: 'script',
                  label: 'Script',
                  requestCount: 4,
                  size: 103675,
                  countOverBudget: '2 requests',
                  sizeOverBudget: 72955,
                },
              ],
            },
          },
        },
      };

      lhrWithResourceSummary = {
        finalUrl: 'http://example.com',
        audits: {
          'resource-summary': {
            details: {
              items: [
                {
                  resourceType: 'document',
                  label: 'Document',
                  requestCount: 1,
                  size: 1143,
                },
                {
                  resourceType: 'font',
                  label: 'Font',
                  requestCount: 2,
                  size: 86751,
                },
                {
                  resourceType: 'stylesheet',
                  label: 'Stylesheet',
                  requestCount: 3,
                  size: 9842,
                },
                {
                  resourceType: 'third-party',
                  label: 'Third-party',
                  requestCount: 7,
                  size: 94907,
                },
              ],
            },
          },
        },
      };
    });

    it('should return assertion results for budgets UI', () => {
      const assertions = {
        'performance-budget': 'error',
      };

      // Include the LHR twice to exercise our de-duping logic.
      const lhrs = [lhrWithBudget, lhrWithBudget];
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toEqual([
        {
          url: 'http://page-1.com',
          actual: 3608,
          auditId: 'performance-budget',
          auditProperty: 'document.size',
          expected: 1024,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [3608],
        },
        {
          url: 'http://page-1.com',
          actual: 103675,
          auditId: 'performance-budget',
          auditProperty: 'script.size',
          expected: 30720,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [103675],
        },
        {
          url: 'http://page-1.com',
          actual: 4,
          auditId: 'performance-budget',
          auditProperty: 'script.count',
          expected: 2,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [4],
        },
      ]);
    });

    it('should assert budgets natively', () => {
      const budgets = [
        {
          resourceCounts: [
            {resourceType: 'font', budget: 1},
            {resourceType: 'third-party', budget: 5},
          ],
          resourceSizes: [{resourceType: 'document', budget: 400}],
        },
      ];

      const lhrs = [lhrWithResourceSummary, lhrWithResourceSummary];
      const results = getAllAssertionResults(convertBudgetsToAssertions(budgets), lhrs);
      expect(results).toEqual([
        {
          url: 'http://example.com',
          actual: 2,
          auditId: 'resource-summary',
          auditProperty: 'font.count',
          expected: 1,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [2, 2],
        },
        {
          url: 'http://example.com',
          actual: 7,
          auditId: 'resource-summary',
          auditProperty: 'third-party.count',
          expected: 5,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [7, 7],
        },
        {
          url: 'http://example.com',
          actual: 1143,
          auditId: 'resource-summary',
          auditProperty: 'document.size',
          expected: 400,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [1143, 1143],
        },
      ]);
    });

    it('should assert budgets after the fact', () => {
      const assertions = {
        'resource-summary.document.size': ['error', {maxNumericValue: 400}],
        'resource-summary.font.count': ['warn', {maxNumericValue: 1}],
        'resource-summary.third-party.count': ['warn', {maxNumericValue: 5}],
      };

      const lhrs = [lhrWithResourceSummary, lhrWithResourceSummary];
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toEqual([
        {
          url: 'http://example.com',
          actual: 1143,
          auditId: 'resource-summary',
          auditProperty: 'document.size',
          expected: 400,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [1143, 1143],
        },
        {
          url: 'http://example.com',
          actual: 2,
          auditId: 'resource-summary',
          auditProperty: 'font.count',
          expected: 1,
          level: 'warn',
          name: 'maxNumericValue',
          operator: '<=',
          values: [2, 2],
        },
        {
          url: 'http://example.com',
          actual: 7,
          auditId: 'resource-summary',
          auditProperty: 'third-party.count',
          expected: 5,
          level: 'warn',
          name: 'maxNumericValue',
          operator: '<=',
          values: [7, 7],
        },
      ]);
    });
  });

  describe('URL-grouping', () => {
    beforeEach(() => {
      for (const lhr of [...lhrs]) {
        lhrs.push({...lhr, finalUrl: 'http://page-2.com'});
      }
    });

    it('should report for URLs separately', () => {
      const assertions = {'first-contentful-paint': ['error', {minScore: 0.9}]};
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toEqual([
        {
          url: 'http://page-1.com',
          actual: 0.8,
          auditId: 'first-contentful-paint',
          expected: 0.9,
          level: 'error',
          name: 'minScore',
          operator: '>=',
          values: [0.6, 0.8],
        },
        {
          url: 'http://page-2.com',
          actual: 0.8,
          auditId: 'first-contentful-paint',
          expected: 0.9,
          level: 'error',
          name: 'minScore',
          operator: '>=',
          values: [0.6, 0.8],
        },
      ]);
    });

    it('should filter to matching URLs', () => {
      const assertions = {'first-contentful-paint': ['error', {minScore: 0.9}]};
      const matchingUrlPattern = '.*-2.com';
      const results = getAllAssertionResults({assertions, matchingUrlPattern}, lhrs);

      expect(results).toEqual([
        {
          url: 'http://page-2.com',
          actual: 0.8,
          auditId: 'first-contentful-paint',
          expected: 0.9,
          level: 'error',
          name: 'minScore',
          operator: '>=',
          values: [0.6, 0.8],
        },
      ]);
    });

    it('should work when no filter matches', () => {
      const assertions = {'first-contentful-paint': ['error', {minScore: 0.9}]};
      const matchingUrlPattern = 'this-will-never-match-anything';
      const results = getAllAssertionResults({assertions, matchingUrlPattern}, lhrs);

      expect(results).toEqual([]);
    });
  });

  describe('assertMatrix', () => {
    beforeEach(() => {
      for (const lhr of [...lhrs]) {
        lhrs.push({...lhr, finalUrl: 'http://page-2.com'});
      }
    });

    it('should support multiple assertion sets', () => {
      const assertMatrix = [
        {
          matchingUrlPattern: '.*-1.com',
          assertions: {'first-contentful-paint': ['error', {minScore: 0.9}]},
        },
        {
          matchingUrlPattern: '.*-2.com',
          assertions: {'first-contentful-paint': ['error', {minScore: 0.95}]},
        },
      ];
      const results = getAllAssertionResults({assertMatrix}, lhrs);

      expect(results).toEqual([
        {
          url: 'http://page-1.com',
          actual: 0.8,
          auditId: 'first-contentful-paint',
          expected: 0.9,
          level: 'error',
          name: 'minScore',
          operator: '>=',
          values: [0.6, 0.8],
        },
        {
          url: 'http://page-2.com',
          actual: 0.8,
          auditId: 'first-contentful-paint',
          expected: 0.95,
          level: 'error',
          name: 'minScore',
          operator: '>=',
          values: [0.6, 0.8],
        },
      ]);
    });

    it('should throw when trying to use assertMatrix with other options', () => {
      const options = {assertMatrix: [], matchingUrlPattern: '', assertions: {}};
      expect(() => getAllAssertionResults(options, [])).toThrow();
    });
  });
});
