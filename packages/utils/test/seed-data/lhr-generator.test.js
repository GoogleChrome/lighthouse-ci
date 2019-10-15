/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const PRandom = require('@lhci/utils/src/seed-data/prandom.js');
const {createLHR, generateNumericValue} = require('@lhci/utils/src/seed-data/lhr-generator.js');

describe('createLHR', () => {
  it('should create the correct shape', () => {
    const random = new PRandom();
    const lhr = createLHR('http://example.com', [{auditId: 'seo-audit', passRate: 1}], random);

    expect(lhr).toMatchObject({
      requestedUrl: 'http://example.com',
      finalUrl: 'http://example.com',
      audits: {
        'seo-audit': {
          title: 'Seo Audit',
          description: expect.stringContaining('Seo Audit'),
          score: 1,
          scoreDisplayMode: 'binary',
        },
      },
      categories: {
        seo: {
          id: 'seo',
          title: 'SEO',
          score: 1,
          auditRefs: [{id: 'seo-audit', group: 'seo', weight: 1}],
        },
      },
    });
  });

  it('should score categories based on audits', () => {
    const random = new PRandom();
    const lhr = createLHR(
      'http://example.com',
      [
        {auditId: 'seo-audit-1', passRate: 0},
        {auditId: 'seo-audit-2', passRate: 0},
        {auditId: 'seo-audit-3', passRate: 0},
        {auditId: 'seo-audit-4', passRate: 1},
      ],
      random
    );

    expect(lhr).toMatchObject({
      categories: {
        seo: {
          score: 0.25,
        },
      },
    });
  });

  it('should generate opportunity items correctly', () => {
    const random = new PRandom();
    const itemA = {
      url: 'http://example.com/script.js',
      averageWastedMs: 500,
      averageTotalBytes: 10000,
      averageWastedBytes: 1000,
    };

    const itemB = {
      node: {type: 'node', snippet: '<pre>pwned</pre>'},
    };

    const lhr = createLHR(
      'http://example.com',
      [
        {
          auditId: 'uses-text-compression',
          averageWastedMs: 500,
          items: [itemA, itemB],
        },
      ],
      random
    );

    expect(lhr).toMatchObject({
      audits: {
        'uses-text-compression': {
          scoreDisplayMode: 'numeric',
          displayValue: '138 KB',
          details: {
            overallSavingsMs: 548.7281855195761,
            overallSavingsBytes: 141023.14367853105,
            headings: [
              {key: 'url', valueType: 'url', label: 'URL'},
              {key: 'wastedMs', valueType: 'timespanMs', label: 'Wasted Ms'},
              {key: 'totalBytes', valueType: 'bytes', label: 'Total Bytes'},
              {key: 'wastedBytes', valueType: 'bytes', label: 'Wasted Bytes'},
              {key: 'node', valueType: 'text', label: 'Node'},
            ],
            items: [
              {
                totalBytes: 10998.033925890923,
                url: 'http://example.com/script.js',
                wastedBytes: 1065.8302195370197,
                wastedMs: 506.31933622062206,
              },
              {
                node: {
                  snippet: '<pre>pwned</pre>',
                  type: 'node',
                },
              },
            ],
          },
        },
      },
    });
  });
});

describe('generateNumericValue', () => {
  it('should generate numbers centered around the average', () => {
    const random = new PRandom();
    const numbers = [];
    for (let i = 0; i < 10; i++) numbers[i] = generateNumericValue(100, random);
    expect(numbers).toEqual([
      109.74563710391521,
      96.9760662317276,
      101.26386724412441,
      109.98033925890923,
      106.58302195370197,
      92.64956168830395,
      106.50991648435593,
      106.77365444600582,
      92.26082369685173,
      91.17857791483402,
    ]);
  });

  it('should follow the expected statistics', () => {
    const random = new PRandom();
    const numbers = [];
    for (let i = 0; i < 10000; i++) numbers[i] = generateNumericValue(100, random);

    const mean = Math.round(numbers.reduce((x, y) => x + y) / numbers.length);
    const max = Math.round(Math.max(...numbers));
    const min = Math.round(Math.min(...numbers));
    expect({mean, max, min}).toEqual({mean: 100, max: 110, min: 90});
  });
});
