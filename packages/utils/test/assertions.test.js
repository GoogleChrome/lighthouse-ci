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
        categories: {pwa: {score: 0.5}, perf: {score: 0.1}},
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
        categories: {pwa: {score: 0.8}, perf: {score: 0.1}},
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
        passed: false,
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

  it('should return passed assertions with flag', () => {
    const assertions = {
      'first-contentful-paint': ['error', {minScore: 0.5}],
      'network-requests': ['warn', {maxLength: 10}],
    };

    const results = getAllAssertionResults({assertions, includePassedAssertions: true}, lhrs);
    expect(results).toEqual([
      {
        actual: 0.8,
        auditId: 'first-contentful-paint',
        expected: 0.5,
        level: 'error',
        name: 'minScore',
        operator: '>=',
        url: 'http://page-1.com',
        values: [0.6, 0.8],
        passed: true,
      },
      {
        actual: 2,
        auditId: 'network-requests',
        expected: 10,
        level: 'warn',
        name: 'maxLength',
        operator: '<=',
        url: 'http://page-1.com',
        values: [4, 2],
        passed: true,
      },
    ]);
  });

  it('should assert audit failures', () => {
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
        passed: false,
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
        passed: false,
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
        passed: false,
      },
    ]);
  });

  it('should assert category failures', () => {
    const assertions = {
      'categories.pwa': 'warn',
      'categories:perf': 'error',
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toEqual([
      {
        url: 'http://page-1.com',
        actual: 0.8,
        auditId: 'categories',
        auditProperty: 'pwa',
        expected: 0.9,
        level: 'warn',
        name: 'minScore',
        operator: '>=',
        values: [0.5, 0.8],
        passed: false,
      },
      {
        url: 'http://page-1.com',
        actual: 0.1,
        auditId: 'categories',
        auditProperty: 'perf',
        expected: 0.9,
        level: 'error',
        name: 'minScore',
        operator: '>=',
        values: [0.1, 0.1],
        passed: false,
      },
    ]);
  });

  it('should use minScore = 0.9 by default', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic'}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toMatchObject([{actual: 0.8, expected: 0.9}]);
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
    expect(results).toMatchObject([{actual: 0, expected: 0.9, name: 'minScore'}]);
  });

  it('should de-dupe camelcase audits', () => {
    const assertions = {
      firstContentfulPaint: ['warn', {aggregationMethod: 'optimistic', minScore: 1}],
      'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic', minScore: 1}],
    };

    const results = getAllAssertionResults({assertions}, lhrs);
    expect(results).toMatchObject([{actual: 0.8}]);
  });

  describe('title and documntation', () => {
    it('should set auditTitle', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'pessimistic'}],
      };

      // Make sure it pulls from failing audit
      lhrs[0].audits['first-contentful-paint'].title = 'Passed';
      lhrs[0].audits['first-contentful-paint'].score = 1;
      lhrs[1].audits['first-contentful-paint'].title = 'First Contentful Paint';

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{auditTitle: 'First Contentful Paint'}]);
    });

    it('should set auditDocumentationLink', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic'}],
      };

      lhrs[0].audits['first-contentful-paint'].description = [
        'First contentful paint is a really cool [metric](https://example.com/)',
        '[Learn More](https://www.web.dev/first-contentful-paint).',
        'There are other cool [metrics](https://example.com/) too.',
      ].join(' ');

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([
        {auditDocumentationLink: 'https://www.web.dev/first-contentful-paint'},
      ]);
    });

    it('should not set auditDocumentationLink when no match', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'optimistic'}],
      };

      lhrs[0].audits['first-contentful-paint'].description = [
        'First contentful paint is a really cool [metric](https://example.com/)',
        '[Learn More](https://non-documentation-link.com/first-contentful-paint).',
        'There are other cool [metrics](https://example.com/) too.',
      ].join(' ');

      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toHaveLength(1);
      expect(results[0]).not.toHaveProperty('auditTitle');
      expect(results[0]).not.toHaveProperty('auditDocumentationLink');
    });
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
          passed: false,
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
      expect(results).toMatchObject([{actual: 0.6, expected: 0.9, name: 'minScore'}]);
    });

    it('should handle partial failure with mode median', () => {
      const assertions = {
        'first-contentful-paint': ['warn', {aggregationMethod: 'median'}],
      };

      lhrs[1].audits['first-contentful-paint'].score = null;
      const results = getAllAssertionResults({assertions}, lhrs);
      expect(results).toMatchObject([{actual: 0.6, expected: 0.9, name: 'minScore'}]);
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
    const auditIds = Object.keys(lighthouseAllPreset.assertions)
      .filter(id => lighthouseAllPreset.assertions[id][0] !== 'off')
      .filter(id => id !== 'performance-budget') // budgets are handled separately
      .sort();

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
      const assertedIds = results.map(r => r.auditId).sort();
      expect(assertedIds).toEqual(auditIds);

      for (const result of results) {
        if (result.auditId === 'first-contentful-paint') {
          expect(result).toMatchObject({
            auditId: result.auditId,
            level: 'warn',
            expected: 0.6,
            actual: 0.5,
          });
        } else {
          expect(result).toMatchObject({
            auditId: result.auditId,
            level: 'error',
            expected: 0.9,
            actual: 0.7,
          });
        }
      }
    });

    it('should use the preset as-is', () => {
      const results = getAllAssertionResults({preset: 'lighthouse:all'}, lhrs);
      const assertedIds = results.map(r => r.auditId).sort();
      expect(assertedIds).toEqual(auditIds);

      for (const result of results) {
        expect(result).toMatchObject({
          auditId: result.auditId,
          level: 'error',
          expected: 0.9,
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
          passed: false,
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
          passed: false,
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
          passed: false,
        },
      ]);
    });

    it('should return assertion results for budgets v6 UI', () => {
      const assertions = {
        'performance-budget': 'error',
      };

      for (const item of lhrWithBudget.audits['performance-budget'].details.items) {
        item.transferSize = item.size;
        delete item.size;
      }

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
          passed: false,
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
          passed: false,
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
          passed: false,
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
          resourceSizes: [{resourceType: 'document', budget: 1}],
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
          passed: false,
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
          passed: false,
        },
        {
          url: 'http://example.com',
          actual: 1143,
          auditId: 'resource-summary',
          auditProperty: 'document.size',
          expected: 1024,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          values: [1143, 1143],
          passed: false,
        },
      ]);
    });

    it('should assert budgets after the fact', () => {
      const assertions = {
        'resource-summary.document.size': ['error', {maxNumericValue: 400}],
        'resource-summary:font.count': ['warn', {maxNumericValue: 1}],
        'resource-summary:third-party.count': ['warn', {maxNumericValue: 5}],
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
          passed: false,
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
          passed: false,
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
          passed: false,
        },
      ]);
    });

    it('should assert v6 budgets after the fact', () => {
      const assertions = {
        'resource-summary.document.size': ['error', {maxNumericValue: 400}],
        'resource-summary:font.count': ['warn', {maxNumericValue: 1}],
        'resource-summary:third-party.count': ['warn', {maxNumericValue: 5}],
      };

      for (const item of lhrWithResourceSummary.audits['resource-summary'].details.items) {
        item.transferSize = item.size;
        delete item.size;
      }

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
          passed: false,
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
          passed: false,
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
          passed: false,
        },
      ]);
    });
  });

  describe('user timings', () => {
    let lhrWithUserTimings;

    beforeEach(() => {
      lhrWithUserTimings = {
        finalUrl: 'http://example.com',
        audits: {
          'user-timings': {
            details: {
              items: [
                {name: 'Core initializer', startTime: 757, duration: 123, timingType: 'Measure'},
                {name: 'super_Cool_Measure', startTime: 999, duration: 52, timingType: 'Measure'},
                {name: 'ultraCoolMark', startTime: 5231, timingType: 'Mark'},
                {name: 'other:%Cool.Mark', startTime: 12052, timingType: 'Mark'},
                // Duplicates will be ignored
                {name: 'super_Cool_Measure', startTime: 0, duration: 4252, timingType: 'Measure'},
              ],
            },
          },
        },
      };
    });

    it('should assert user timing keys', () => {
      const assertions = {
        'user-timings.core-initializer': ['error', {maxNumericValue: 100}],
        'user-timings.super-cool-measure': ['warn', {maxNumericValue: 100}],
        'user-timings:ultra-cool-mark': ['warn', {maxNumericValue: 5000}],
        'user-timings:other-cool-mark': ['error', {maxNumericValue: 10000}],
        'user-timings:missing-timing': ['error', {maxNumericValue: 10000}],
      };

      const lhrs = [lhrWithUserTimings, lhrWithUserTimings];
      const results = getAllAssertionResults({assertions, includePassedAssertions: true}, lhrs);
      expect(results).toEqual([
        {
          actual: 123,
          auditId: 'user-timings',
          auditProperty: 'core-initializer',
          expected: 100,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          passed: false,
          url: 'http://example.com',
          values: [123, 123],
        },
        {
          actual: 52,
          auditId: 'user-timings',
          auditProperty: 'super-cool-measure',
          expected: 100,
          level: 'warn',
          name: 'maxNumericValue',
          operator: '<=',
          passed: true,
          url: 'http://example.com',
          values: [52, 52],
        },
        {
          actual: 5231,
          auditId: 'user-timings',
          auditProperty: 'ultra-cool-mark',
          expected: 5000,
          level: 'warn',
          name: 'maxNumericValue',
          operator: '<=',
          passed: false,
          url: 'http://example.com',
          values: [5231, 5231],
        },
        {
          actual: 12052,
          auditId: 'user-timings',
          auditProperty: 'other-cool-mark',
          expected: 10000,
          level: 'error',
          name: 'maxNumericValue',
          operator: '<=',
          passed: false,
          url: 'http://example.com',
          values: [12052, 12052],
        },
        {
          actual: 0,
          auditId: 'user-timings',
          auditProperty: 'missing-timing',
          expected: 1,
          level: 'error',
          name: 'auditRan',
          operator: '>=',
          passed: false,
          url: 'http://example.com',
          values: [0, 0],
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
          passed: false,
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
          passed: false,
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
          passed: false,
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
          passed: false,
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
          passed: false,
        },
      ]);
    });

    it('should throw when trying to use assertMatrix with other options', () => {
      const options = {assertMatrix: [], matchingUrlPattern: '', assertions: {}};
      expect(() => getAllAssertionResults(options, [])).toThrow();
    });

    it('should not throw when trying to use assertMatrix with other unrelated options', () => {
      const options = {assertMatrix: [], config: 'path/to/file', serverBaseUrl: ''};
      expect(() => getAllAssertionResults(options, [])).not.toThrow();
    });
  });
});
