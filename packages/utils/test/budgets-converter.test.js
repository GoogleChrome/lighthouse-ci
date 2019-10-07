/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {
  convertPathExpressionToRegExp,
  convertBudgetsToAssertions,
} = require('@lhci/utils/src/budgets-converter.js');

describe('convertPathExpressionToRegExp', () => {
  const pathMatch = (path, pattern) => {
    const origin = 'https://example.com';
    return convertPathExpressionToRegExp(pattern).test(origin + path);
  };

  it('matches root', () => {
    expect(convertPathExpressionToRegExp('/').test('https://google.com')).toBe(true);
  });

  it('ignores origin', () => {
    expect(convertPathExpressionToRegExp('/go').test('https://go.com/dogs')).toBe(false);
    expect(convertPathExpressionToRegExp('/videos').test('https://yt.com/videos?id=')).toBe(true);
  });

  it('is case-sensitive', () => {
    expect(convertPathExpressionToRegExp('/aaa').test('https://abc.com/aaa')).toBe(true);
    expect(convertPathExpressionToRegExp('/aaa').test('https://abc.com/AAA')).toBe(false);
    expect(convertPathExpressionToRegExp('/AAA').test('https://abc.com/aaa')).toBe(false);
  });

  it('matches all pages if path is not defined', () => {
    expect(convertPathExpressionToRegExp(undefined).test('https://example.com')).toBe(true);
    expect(convertPathExpressionToRegExp(undefined).test('https://example.com/dogs')).toBe(true);
  });

  it('handles patterns that do not contain * or $', () => {
    expect(pathMatch('/anything', '/')).toBe(true);
    expect(pathMatch('/anything', '/any')).toBe(true);
    expect(pathMatch('/anything', '/anything')).toBe(true);
    expect(pathMatch('/anything', '/anything1')).toBe(false);
  });

  it('handles patterns that do not contain * but contain $', () => {
    expect(pathMatch('/fish.php', '/fish.php$')).toBe(true);
    expect(pathMatch('/Fish.PHP', '/fish.php$')).toBe(false);
  });

  it('handles patterns that contain * but do not contain $', () => {
    expect(pathMatch('/anything', '/*')).toBe(true);
    expect(pathMatch('/fish', '/fish*')).toBe(true);
    expect(pathMatch('/fishfood', '/*food')).toBe(true);
    expect(pathMatch('/fish/food/and/other/things', '/*food')).toBe(true);
    expect(pathMatch('/fis/', '/fish*')).toBe(false);
    expect(pathMatch('/fish', '/fish*fish')).toBe(false);
  });

  it('handles patterns that contain * and $', () => {
    expect(pathMatch('/fish.php', '/*.php$')).toBe(true);
    expect(pathMatch('/folder/filename.php', '/folder*.php$')).toBe(true);
    expect(pathMatch('/folder/filename.php', '/folder/filename*.php$')).toBe(true);
    expect(pathMatch('/fish.php?species=', '/*.php$')).toBe(false);
    expect(pathMatch('/filename.php/', '/folder*.php$')).toBe(false);
    expect(pathMatch('/folder', '/folder*folder$')).toBe(false);
  });
});

describe('convertBudgetsToAssertions', () => {
  it('should convert budgets to assertions format', () => {
    const budgets = [
      {
        resourceSizes: [
          {
            resourceType: 'script',
            budget: 123,
          },
          {
            resourceType: 'image',
            budget: 456,
          },
        ],
        resourceCounts: [
          {
            resourceType: 'total',
            budget: 100,
          },
          {
            resourceType: 'third-party',
            budget: 10,
          },
        ],
      },
      {
        path: '/second-path',
        resourceSizes: [
          {
            resourceType: 'script',
            budget: 1000,
          },
        ],
      },
    ];

    const results = convertBudgetsToAssertions(budgets);
    expect(results).toEqual({
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'resource-summary.script.size': ['error', {maxNumericValue: 123}],
            'resource-summary.image.size': ['error', {maxNumericValue: 456}],
            'resource-summary.third-party.count': ['error', {maxNumericValue: 10}],
            'resource-summary.total.count': ['error', {maxNumericValue: 100}],
          },
        },
        {
          matchingUrlPattern: 'https?:\\/\\/[^\\/]+\\/second\\-path',
          assertions: {
            'resource-summary.script.size': ['error', {maxNumericValue: 1000}],
          },
        },
      ],
    });
  });
});
