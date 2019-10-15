/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {
  findAuditDiffs,
  getDiffSeverity,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
} = require('@lhci/utils/src/audit-diff-finder.js');

describe('#findAuditDiffs', () => {
  it('should return empty array for identical audits', () => {
    const baseAudit = {id: 'audit', score: 0.5, displayValue: '4 items'};
    const compareAudit = {id: 'audit', score: 0.5, displayValue: '4 items'};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should find error diffs for score', () => {
    const baseAudit = {id: 'audit', score: null, scoreDisplayMode: 'error'};
    const compareAudit = {id: 'audit', score: 0.5};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'error',
        attemptedType: 'score',
        baseValue: NaN,
        compareValue: 0.5,
      },
    ]);
  });

  it('should find error diffs for numericValue', () => {
    const baseAudit = {id: 'audit', score: 0.5};
    const compareAudit = {id: 'audit', score: 0.5, numericValue: 105};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'error',
        attemptedType: 'numericValue',
        baseValue: NaN,
        compareValue: 105,
      },
    ]);
  });

  it('should return empty array for identical 0-based audits', () => {
    const baseAudit = {id: 'audit', score: 0.5, numericValue: 0, details: {items: []}};
    const compareAudit = {id: 'audit', score: 0.5, numericValue: 0, details: {items: []}};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should find score diffs', () => {
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

    expect(findAuditDiffs({...baseAudit, score: 0.95}, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 0.95,
        compareValue: 0.4,
      },
    ]);
  });

  it('should find score diffs for notApplicable audits', () => {
    const baseAudit = {id: 'audit', scoreDisplayMode: 'notApplicable', score: null};
    const compareAudit = {id: 'audit', score: 0};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 1,
        compareValue: 0,
      },
    ]);
  });

  it('should find score diffs for informative audits', () => {
    const baseAudit = {id: 'audit', scoreDisplayMode: 'informative', score: null};
    const compareAudit = {id: 'audit', score: 1};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 0,
        compareValue: 1,
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

  it('should find a numericValue diff for overallSavingsMs', () => {
    const baseAudit = {id: 'audit', score: 0.4, details: {overallSavingsMs: 3200}};
    const compareAudit = {id: 'audit', score: 0.4, details: {overallSavingsMs: 1600}};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'numericValue',
        baseValue: 3200,
        compareValue: 1600,
      },
    ]);
  });

  it('should find a numericValue diff for not applicable', () => {
    const baseAudit = {id: 'audit', score: null, scoreDisplayMode: 'notApplicable'};
    const compareAudit = {id: 'audit', score: 0.7, numericValue: 1600};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 1,
        compareValue: 0.7,
      },
      {
        auditId: 'audit',
        type: 'numericValue',
        baseValue: 0,
        compareValue: 1600,
      },
    ]);
  });

  it('should find a displayValue diff', () => {
    const baseAudit = {id: 'audit', score: 0.4, displayValue: '4 items'};
    const compareAudit = {id: 'audit', score: 0.4, displayValue: '2 items'};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'displayValue',
        baseValue: '4 items',
        compareValue: '2 items',
      },
    ]);
  });

  it('should find a details item addition diff for not applicable', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {id: 'audit', score: null, scoreDisplayMode: 'notApplicable'};
    const compareAudit = {id: 'audit', score: 0.5, details: {items: [detailsItem]}};

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 1,
        compareValue: 0.5,
      },
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

  it('should find a details item diff without url', () => {
    const baseAudit = {id: 'audit', score: 0.5, details: {items: [{node: 'a'}, {node: 'b'}]}};
    const compareAudit = {id: 'audit', score: 0.5, details: {items: [{node: 'c'}, {node: 'a'}]}};

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'itemRemoval',
        baseItemIndex: 1,
      },
      {
        auditId: 'audit',
        type: 'itemAddition',
        compareItemIndex: 0,
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

describe('#getDiffSeverity', () => {
  it('should sort the diffs in order of severity', () => {
    const baseAudit = {
      id: 'audit',
      score: 0.9,
      numericValue: 1000,
      details: {items: [{url: 'urlA', wastedMs: 2000}, {url: 'urlB', wastedKb: 2000e3}]},
    };

    const compareAuditA = {
      id: 'audit',
      score: 0.7,
      numericValue: 1100,
      details: {items: [{url: 'urlA', wastedMs: 2500}, {url: 'urlD', wastedKb: 70e3}]},
    };

    const compareAuditB = {
      id: 'audit',
      score: 0.2,
      numericValue: 400,
      details: {items: [{url: 'urlA', wastedMs: 1200}, {url: 'urlB', wastedKb: 1800e3}]},
    };

    const diffs = [
      ...findAuditDiffs(baseAudit, compareAuditA),
      ...findAuditDiffs(baseAudit, compareAuditB),
    ].sort((a, b) => getDiffSeverity(b) - getDiffSeverity(a));

    expect(diffs).toEqual([
      {
        auditId: 'audit',
        baseValue: 0.9,
        compareValue: 0.2,
        type: 'score',
      },
      {
        auditId: 'audit',
        baseValue: 0.9,
        compareValue: 0.7,
        type: 'score',
      },
      {
        auditId: 'audit',
        baseValue: 1000,
        compareValue: 1100,
        type: 'numericValue',
      },
      {
        auditId: 'audit',
        baseValue: 1000,
        compareValue: 400,
        type: 'numericValue',
      },
      {
        auditId: 'audit',
        baseItemIndex: 1,
        type: 'itemRemoval',
      },
      {
        auditId: 'audit',
        compareItemIndex: 1,
        type: 'itemAddition',
      },
      {
        auditId: 'audit',
        baseItemIndex: 1,
        baseValue: 2000000,
        compareItemIndex: 1,
        compareValue: 1800000,
        itemKey: 'wastedKb',
        type: 'itemDelta',
      },
      {
        auditId: 'audit',
        baseItemIndex: 0,
        baseValue: 2000,
        compareItemIndex: 0,
        compareValue: 1200,
        itemKey: 'wastedMs',
        type: 'itemDelta',
      },
      {
        auditId: 'audit',
        baseItemIndex: 0,
        baseValue: 2000,
        compareItemIndex: 0,
        compareValue: 2500,
        itemKey: 'wastedMs',
        type: 'itemDelta',
      },
    ]);
  });
});

describe('#getDiffLabel', () => {
  it('should categorize errors', () => {
    expect(getDiffLabel({type: 'error'})).toEqual('regression');
  });

  it('should categorize score increases', () => {
    expect(getDiffLabel({type: 'score', baseValue: 0.7, compareValue: 0.9})).toEqual('improvement');
  });

  it('should categorize score decreases', () => {
    expect(getDiffLabel({type: 'score', baseValue: 0.7, compareValue: 0.5})).toEqual('regression');
  });

  it('should categorize numericValue increases', () => {
    expect(getDiffLabel({type: 'numericValue', baseValue: 500, compareValue: 1000})).toEqual(
      'regression'
    );
  });

  it('should categorize numericValue decreases', () => {
    expect(getDiffLabel({type: 'numericValue', baseValue: 1000, compareValue: 500})).toEqual(
      'improvement'
    );
  });

  it('should categorize itemAddition', () => {
    expect(getDiffLabel({type: 'itemAddition'})).toEqual('regression');
  });

  it('should categorize itemRemoval', () => {
    expect(getDiffLabel({type: 'itemRemoval'})).toEqual('improvement');
  });
});

describe('#getRowLabel', () => {
  it('should categorize added', () => {
    expect(getRowLabel([{type: 'itemAddition'}])).toEqual('added');
  });

  it('should categorize removed', () => {
    expect(getRowLabel([{type: 'itemRemoval'}])).toEqual('removed');
  });

  it('should categorize better', () => {
    expect(getRowLabel([{type: 'itemDelta', compareValue: 5, baseValue: 10}])).toEqual('better');
  });

  it('should categorize worse', () => {
    expect(getRowLabel([{type: 'itemDelta', compareValue: 10, baseValue: 5}])).toEqual('worse');
  });

  it('should categorize ambiguous', () => {
    expect(
      getRowLabel([
        {type: 'itemDelta', compareValue: 10, baseValue: 5},
        {type: 'itemDelta', compareValue: 5, baseValue: 10},
      ])
    ).toEqual('ambiguous');
  });

  it('should categorize no change', () => {
    expect(getRowLabel([])).toEqual('no change');
  });
});

describe('#getRowLabel', () => {
  it('should categorize row label', () => {
    const diffs = [
      {type: 'itemAddition', compareItemIndex: 27},
      {type: 'itemRemoval', baseItemIndex: 5},
      {type: 'itemDelta', compareItemIndex: 2, baseItemIndex: 0, compareValue: 0, baseValue: 1},
    ];

    expect(getRowLabelForIndex(diffs, 27, undefined)).toEqual('added');
    expect(getRowLabelForIndex(diffs, undefined, 5)).toEqual('removed');
    expect(getRowLabelForIndex(diffs, 2, 0)).toEqual('better');
  });
});
