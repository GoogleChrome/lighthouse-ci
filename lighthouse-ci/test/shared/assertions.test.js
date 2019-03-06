/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {getAllAssertionResults} = require('../../src/shared/assertions.js');

describe('getAllAssertionResults', () => {
  let lhrs;

  beforeEach(() => {
    lhrs = [
      {
        audits: {
          'first-contentful-paint': {
            score: 0.6,
          },
          'network-requests': {
            details: {items: [1, 2, 3, 4]},
          },
        },
      },
      {
        audits: {
          'first-contentful-paint': {
            score: 0.8,
          },
          'network-requests': {
            details: {items: [1, 2]},
          },
        },
      },
    ];
  });

  it('should throw on assertion for audit that did not run', () => {
    const assertions = {missing: 'error'};
    expect(() => getAllAssertionResults(assertions, lhrs)).toThrow();
  });

  it('should pass assertions', () => {
    const assertions = {
      'first-contentful-paint': ['error', {minScore: 0.5}],
      'network-requests': ['warn', {maxLength: 10}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toEqual([]);
  });

  it('should assert failures', () => {
    const assertions = {
      'first-contentful-paint': ['error', {minScore: 0.9}],
      'network-requests': ['warn', {maxLength: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toEqual([
      {
        actual: 0.8,
        auditId: 'first-contentful-paint',
        expected: 0.9,
        level: 'error',
        name: 'minScore',
        operator: '>=',
        values: [0.6, 0.8],
      },
      {
        actual: 2,
        auditId: 'network-requests',
        expected: 1,
        level: 'warn',
        name: 'maxLength',
        operator: '<=',
        values: [4, 2],
      },
    ]);
  });

  it('should use minScore = 1 by default', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {mergeMethod: 'optimistic', minScore: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toMatchObject([{actual: 0.8}]);
  });

  it('should use mergeMethod optimistic', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {mergeMethod: 'optimistic', minScore: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toMatchObject([{actual: 0.8}]);
  });

  it('should use mergeMethod pessimistic', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {mergeMethod: 'pessimistic', minScore: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toMatchObject([{actual: 0.6}]);
  });

  it('should use mergeMethod median', () => {
    const assertions = {
      'first-contentful-paint': ['warn', {mergeMethod: 'median', minScore: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toMatchObject([{actual: 0.7}]);
  });

  it('should de-dupe camelcase audits', () => {
    const assertions = {
      'firstContentfulPaint': ['warn', {mergeMethod: 'optimistic', minScore: 1}],
      'first-contentful-paint': ['warn', {mergeMethod: 'optimistic', minScore: 1}],
    };

    const results = getAllAssertionResults(assertions, lhrs);
    expect(results).toMatchObject([{actual: 0.8}]);
  });
});
