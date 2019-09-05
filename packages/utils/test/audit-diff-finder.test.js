/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {findAuditDiffs} = require('@lhci/utils/src/audit-diff-finder.js');

describe('#findAuditDiffs', () => {
  it('should return empty array for identical audits', () => {
    const baseAudit = {id: 'audit', score: 0.5};
    const compareAudit = {id: 'audit', score: 0.5};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should find a score diff', () => {
    const baseAudit = {id: 'audit', score: 0.8};
    const compareAudit = {id: 'audit', score: 0.4};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 0.8,
        compareValue: 0.4,
      },
    ]);
  });

  it('should ignore diffs below a certain threshold', () => {
    const baseAudit = {id: 'audit', score: 0.8, numericValue: 100};
    const compareAudit = {id: 'audit', score: 0.8, numericValue: 101};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'numericValue',
        baseValue: 100,
        compareValue: 101,
      },
    ]);

    const options = {percentAbsoluteDeltaThreshold: 0.05};
    expect(findAuditDiffs(baseAudit, compareAudit, options)).toEqual([]);
  });

  it('should find a numericValue diff', () => {
    const baseAudit = {id: 'audit', score: 0.4, numericValue: 3200};
    const compareAudit = {id: 'audit', score: 0.7, numericValue: 1600};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 0.4,
        compareValue: 0.7,
      },
      {
        auditId: 'audit',
        type: 'numericValue',
        baseValue: 3200,
        compareValue: 1600,
      },
    ]);
  });

  it('should find a details item addition diff', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {id: 'audit', score: 0.5, details: {items: []}};
    const compareAudit = {id: 'audit', score: 0.5, details: {items: [detailsItem]}};

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'itemCount',
        baseValue: 0,
        compareValue: 1,
      },
      {
        auditId: 'audit',
        type: 'itemAddition',
        compareItemIndex: 0,
      },
    ]);
  });

  it('should find a details item removal diff', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {id: 'audit', score: 0.5, details: {items: [detailsItem]}};
    const compareAudit = {id: 'audit', score: 0.5, details: {items: []}};

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'itemCount',
        baseValue: 1,
        compareValue: 0,
      },
      {
        auditId: 'audit',
        type: 'itemRemoval',
        baseItemIndex: 0,
      },
    ]);
  });

  it('should find a details item property diff', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {items: [{...detailsItem, timeSpent: 1000, x: 50}]},
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {items: [{...detailsItem, timeSpent: 2000, x: 51}]},
    };

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'itemDelta',
        itemKey: 'timeSpent',
        baseItemIndex: 0,
        compareItemIndex: 0,
        baseValue: 1000,
        compareValue: 2000,
      },
      {
        auditId: 'audit',
        type: 'itemDelta',
        itemKey: 'x',
        baseItemIndex: 0,
        compareItemIndex: 0,
        baseValue: 50,
        compareValue: 51,
      },
    ]);
  });

  it('should find a details item addition/removal diff', () => {
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {items: [{url: 'http://example.com/foo.js'}]},
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {items: [{url: 'http://example.com/foo2.js'}]},
    };

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'itemRemoval',
        baseItemIndex: 0,
      },
      {
        auditId: 'audit',
        type: 'itemAddition',
        compareItemIndex: 0,
      },
    ]);
  });
});
