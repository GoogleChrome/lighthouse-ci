/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {
  findAuditDiffs,
  normalizeDetails,
  mergeHeadings,
  getSubItems,
  getSubItemHeadings,
  diffAndSortSubItems,
  getDiffSeverity,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
  zipBaseAndCompareItems,
  synthesizeItemKeyDiffs,
  sortZippedBaseAndCompareItems,
  replaceNondeterministicStrings,
} = require('../src/audit-diff-finder.js');

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

  it('should not find a numericValue diff for an audit with details but no details diff', () => {
    const itemsA = [{url: 'a', wastedKb: 150}];
    const itemsB = [{url: 'a', wastedKb: 150}];
    const baseAudit = {id: 'audit', score: 0.4, numericValue: 200, details: {items: itemsA}};
    const compareAudit = {id: 'audit', score: 0.4, numericValue: 100, details: {items: itemsB}};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
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

  it('should hide a numericValue diff with passing score and no items', () => {
    const baseAudit = {id: 'audit', score: 1, numericValue: 3200};
    const compareAudit = {id: 'audit', score: 1, numericValue: 1600};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should hide just a displayValue diff', () => {
    const baseAudit = {id: 'audit', score: 0.4, displayValue: '4 items'};
    const compareAudit = {id: 'audit', score: 0.4, displayValue: '2 items'};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should find a displayValue diff', () => {
    const baseAudit = {id: 'audit', score: 0.3, displayValue: '4 items'};
    const compareAudit = {id: 'audit', score: 1, displayValue: '2 items'};
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([
      {
        auditId: 'audit',
        type: 'score',
        baseValue: 0.3,
        compareValue: 1,
      },
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

  it('should synthesize item delta diffs', () => {
    const detailsItem = {url: 'http://example.com/foo.js', wastedMs: 1000};
    const baseAudit = {id: 'audit', score: 0.5, details: {items: []}};
    const compareAudit = {id: 'audit', score: 0.5, details: {items: [detailsItem]}};

    expect(findAuditDiffs(baseAudit, compareAudit)).toMatchObject([
      {type: 'itemCount'},
      {type: 'itemAddition'},
    ]);

    const options = {synthesizeItemKeyDiffs: true};
    expect(findAuditDiffs(baseAudit, compareAudit, options)).toMatchObject([
      {type: 'itemCount'},
      {type: 'itemAddition'},
      {type: 'itemDelta', baseValue: 0, compareValue: 1000, itemKey: 'wastedMs'},
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

  it('should match resource-summary and mainthread-work-breakdown items across locales', () => {
    const baseResourceAudit = {
      id: 'resource-summary',
      score: 1,
      details: {
        headings: [{key: 'label'}, {key: 'requestCount'}],
        items: [{resourceType: 'total', label: 'Total', requestCount: 10}],
      },
    };
    const compareResourceAudit = {
      id: 'resource-summary',
      score: 1,
      details: {
        headings: [{key: 'label'}, {key: 'requestCount'}],
        items: [{resourceType: 'total', label: 'Gesamt', requestCount: 12}],
      },
    };

    expect(findAuditDiffs(baseResourceAudit, compareResourceAudit)).toEqual([
      {
        auditId: 'resource-summary',
        type: 'itemDelta',
        itemKey: 'requestCount',
        baseItemIndex: 0,
        compareItemIndex: 0,
        baseValue: 10,
        compareValue: 12,
      },
    ]);

    const baseMainthreadAudit = {
      id: 'mainthread-work-breakdown',
      score: 0.5,
      details: {
        headings: [{key: 'groupLabel'}, {key: 'duration'}],
        items: [{group: 'scriptEvaluation', groupLabel: 'Script Evaluation', duration: 500}],
      },
    };
    const compareMainthreadAudit = {
      id: 'mainthread-work-breakdown',
      score: 0.5,
      details: {
        headings: [{key: 'groupLabel'}, {key: 'duration'}],
        items: [{group: 'scriptEvaluation', groupLabel: 'Skriptauswertung', duration: 600}],
      },
    };

    expect(findAuditDiffs(baseMainthreadAudit, compareMainthreadAudit)).toEqual([
      {
        auditId: 'mainthread-work-breakdown',
        type: 'itemDelta',
        itemKey: 'duration',
        baseItemIndex: 0,
        compareItemIndex: 0,
        baseValue: 500,
        compareValue: 600,
      },
    ]);

    const baseNetworkAudit = {
      id: 'network-requests',
      score: 1,
      details: {
        headings: [{key: 'url'}, {key: 'transferSize'}],
        items: [
          {url: 'https://example.com/a.js', resourceType: 'Script', transferSize: 100},
          {url: 'https://example.com/b.js', resourceType: 'Script', transferSize: 200},
        ],
      },
    };
    const compareNetworkAudit = {
      id: 'network-requests',
      score: 1,
      details: {
        headings: [{key: 'url'}, {key: 'transferSize'}],
        items: [
          {url: 'https://example.com/a.js', resourceType: 'Script', transferSize: 100},
          {url: 'https://example.com/b.js', resourceType: 'Script', transferSize: 250},
        ],
      },
    };

    expect(findAuditDiffs(baseNetworkAudit, compareNetworkAudit)).toEqual([
      {
        auditId: 'network-requests',
        type: 'itemDelta',
        itemKey: 'transferSize',
        baseItemIndex: 1,
        compareItemIndex: 1,
        baseValue: 200,
        compareValue: 250,
      },
    ]);

    const sharedSource = {
      type: 'source-location',
      url: 'https://example.com/bundle.js',
      line: 0,
      column: 100,
    };
    const baseBaselineAudit = {
      id: 'baseline',
      score: 1,
      details: {
        headings: [{key: 'featureId'}, {key: 'displayStatus'}, {key: 'source'}],
        items: [
          {
            featureId: {
              type: 'link',
              text: 'device-posture',
              url: 'https://webstatus.dev/features/device-posture',
            },
            displayStatus: {
              type: 'baseline-status',
              status: 'limited',
              displayString: 'Limited Availability',
            },
            source: sharedSource,
          },
          {
            featureId: {
              type: 'link',
              text: 'view-transitions',
              url: 'https://webstatus.dev/features/view-transitions',
            },
            displayStatus: {
              type: 'baseline-status',
              status: 'limited',
              displayString: 'Limited Availability',
            },
            source: sharedSource,
          },
        ],
      },
    };
    const compareBaselineAudit = {
      id: 'baseline',
      score: 1,
      details: {
        headings: [{key: 'featureId'}, {key: 'displayStatus'}, {key: 'source'}],
        items: [
          {
            featureId: {
              type: 'link',
              text: 'device-posture',
              url: 'https://webstatus.dev/features/device-posture',
            },
            displayStatus: {
              type: 'baseline-status',
              status: 'limited',
              displayString: 'Limited Availability',
            },
            source: sharedSource,
          },
          {
            featureId: {
              type: 'link',
              text: 'view-transitions',
              url: 'https://webstatus.dev/features/view-transitions',
            },
            displayStatus: {
              type: 'baseline-status',
              status: 'limited',
              displayString: 'Limited Availability',
            },
            source: sharedSource,
          },
        ],
      },
    };

    expect(findAuditDiffs(baseBaselineAudit, compareBaselineAudit)).toEqual([]);
  });

  it('should find a details item property diff', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: 'timeSpent'}, {key: 'x'}],
        items: [{...detailsItem, timeSpent: 1000, x: 50, debug: 200}],
      },
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: 'timeSpent'}, {key: 'x'}],
        items: [{...detailsItem, timeSpent: 2000, x: 51, debug: 100}],
      },
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

  it('should not find a details item property diff for subItems', () => {
    const detailsItem = {url: 'http://example.com/foo.js'};
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: null, subItemsHeading: {key: 'label'}}, {key: 'timeSpent'}],
        items: [{...detailsItem, timeSpent: 1000, subItems: [{label: 'Label 1'}]}],
      },
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: null, subItemsHeading: {key: 'label'}}, {key: 'timeSpent'}],
        items: [{...detailsItem, timeSpent: 1000, subItems: [{label: 'Label 2'}]}],
      },
    };

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });

  it('should handle preact mutations', () => {
    // Create a circular data structure that would fail serialization.
    const circular = {x: {}};
    circular.x = circular;

    // Ensure the two audits are otherwise identical, so serialization is triggered.
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: null, subItemsHeading: {key: 'label'}}, {key: 'timeSpent'}],
        items: [{timeSpent: 1000, subItems: [{label: 'Label 1', _circular: circular}]}],
      },
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {
        headings: [{key: null, subItemsHeading: {key: 'label'}}, {key: 'timeSpent'}],
        items: [{timeSpent: 1000, subItems: [{label: 'Label 1'}], _circular: circular}],
      },
    };

    // Assert that everything passes.
    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
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

  it('should not find a details item addition/removal diff for debugdata', () => {
    const baseAudit = {
      id: 'audit',
      score: 0.5,
      details: {type: 'debugdata', items: [{url: 'http://example.com/foo.js'}]},
    };

    const compareAudit = {
      id: 'audit',
      score: 0.5,
      details: {type: 'debugdata', items: [{url: 'http://example.com/foo2.js'}]},
    };

    expect(findAuditDiffs(baseAudit, compareAudit)).toEqual([]);
  });
});

describe('#getDiffSeverity', () => {
  it('should sort the diffs in order of severity', () => {
    const baseAudit = {
      id: 'audit',
      score: 0.9,
      numericValue: 1000,
      details: {
        headings: [{key: 'wastedMs'}, {key: 'wastedKb'}],
        items: [
          {url: 'urlA', wastedMs: 2000},
          {url: 'urlB', wastedKb: 2000e3},
        ],
      },
    };

    const compareAuditA = {
      id: 'audit',
      score: 0.7,
      numericValue: 1100,
      details: {
        headings: [{key: 'wastedMs'}, {key: 'wastedKb'}],
        items: [
          {url: 'urlA', wastedMs: 2500},
          {url: 'urlD', wastedKb: 70e3},
        ],
      },
    };

    const compareAuditB = {
      id: 'audit',
      score: 0.2,
      numericValue: 400,
      details: {
        headings: [{key: 'wastedMs'}, {key: 'wastedKb'}],
        items: [
          {url: 'urlA', wastedMs: 1200},
          {url: 'urlB', wastedKb: 1800e3},
        ],
      },
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
      {type: 'itemAddition', compareItemIndex: 13, baseItemIndex: undefined},
      {type: 'itemRemoval', baseItemIndex: 8, compareItemIndex: undefined},
      {type: 'itemDelta', compareItemIndex: 2, baseItemIndex: 0, compareValue: 0, baseValue: 1},
    ];

    expect(getRowLabelForIndex(diffs, 27, undefined)).toEqual('added');
    expect(getRowLabelForIndex(diffs, undefined, 5)).toEqual('removed');
    expect(getRowLabelForIndex(diffs, 13, undefined)).toEqual('added');
    expect(getRowLabelForIndex(diffs, undefined, 8)).toEqual('removed');
    expect(getRowLabelForIndex(diffs, 2, 0)).toEqual('better');
  });
});

describe('#zipBaseAndCompareItems', () => {
  it('should zip URLs', () => {
    const base = [{url: 'https://localhost/resource.js', time: 1}];
    const compare = [{url: 'https://localhost/resource.js', time: 2}];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
    ]);
  });

  it('should zip labels', () => {
    const base = [{label: 'Documents', requestCount: 1}];
    const compare = [{label: 'Documents', requestCount: 2}];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
    ]);
  });

  it('should zip string entities (third-parties-insight)', () => {
    const base = [{entity: 'Google Tag Manager', transferSize: 1000, mainThreadTime: 50}];
    const compare = [{entity: 'Google Tag Manager', transferSize: 2000, mainThreadTime: 80}];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
    ]);
  });

  it('should prefer url over entity when both are present (network-requests)', () => {
    const base = [
      {url: 'https://example.com/a.js', entity: 'Example', transferSize: 100},
      {url: 'https://example.com/b.js', entity: 'Example', transferSize: 200},
    ];
    const compare = [
      {url: 'https://example.com/a.js', entity: 'Example', transferSize: 150},
      {url: 'https://example.com/b.js', entity: 'Example', transferSize: 250},
    ];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
      {
        base: {item: base[1], kind: 'base', index: 1},
        compare: {item: compare[1], kind: 'compare', index: 1},
      },
    ]);
  });

  it('should zip nodes', () => {
    const base = [{node: {snippet: '<a>Text</a>'}, count: 1}];
    const compare = [{node: {snippet: '<a>Text</a>'}, count: 1}];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
    ]);
  });

  it('should zip souce-locations', () => {
    const base = [
      {source: {url: 'http://example.com', line: 5, column: 10}, count: 1},
      {source: {url: 'http://example.com', line: 5, column: 16}, count: 1},
    ];
    const compare = [
      {source: {url: 'http://example.com', line: 5, column: 10}, count: 1},
      {source: {url: 'http://example.com', line: 10, column: 2}, count: 1},
    ];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
      {
        base: {item: base[1], kind: 'base', index: 1},
      },
      {
        compare: {item: compare[1], kind: 'compare', index: 1},
      },
    ]);
  });

  it('should not zip ambiguous values', () => {
    const base = [
      {node: {snippet: '<a>Text</a>'}, count: 1},
      {node: {snippet: '<a>Text</a>'}, count: 1},
    ];
    const compare = [{node: {snippet: '<a>Text</a>'}, count: 1}];
    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
      },
      {
        base: {item: base[1], kind: 'base', index: 1},
      },
      {
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
    ]);
  });

  it('should zip multiple items', () => {
    const base = [
      {missingInCompare: true},
      {label: 'Documents', requestCount: 1},
      {node: {snippet: '<a>Text</a>'}, count: 1},
      {url: 'https://localhost/resource.12345678.js', time: 1},
    ];
    const compare = [
      {url: 'https://localhost/resource.87654321.js', time: 2},
      {label: 'Documents', requestCount: 2},
      {node: {snippet: '<a>Text</a>'}, count: 1},
      {missingInBase: true},
    ];

    const zipped = zipBaseAndCompareItems(base, compare);
    expect(zipped).toEqual([
      {
        base: {item: base[0], kind: 'base', index: 0},
      },
      {
        base: {item: base[1], kind: 'base', index: 1},
        compare: {item: compare[1], kind: 'compare', index: 1},
      },
      {
        base: {item: base[2], kind: 'base', index: 2},
        compare: {item: compare[2], kind: 'compare', index: 2},
      },
      {
        base: {item: base[3], kind: 'base', index: 3},
        compare: {item: compare[0], kind: 'compare', index: 0},
      },
      {
        compare: {item: compare[3], kind: 'compare', index: 3},
      },
    ]);
  });
});

describe('#sortZippedBaseAndCompareItems', () => {
  const getDiffs = (base, compare) => {
    return findAuditDiffs(
      {score: 1, details: {headings: Object.keys(base[0]).map(key => ({key})), items: base}},
      {score: 1, details: {headings: Object.keys(compare[0]).map(key => ({key})), items: compare}}
    );
  };

  it('should sort by RowLabel preserving diffs', () => {
    const base = [
      {url: 'a', wastedMs: 100},
      {url: 'b', wastedMs: 100},
      {url: 'c', wastedMs: 100},
      {url: 'd', wastedMs: 100},
    ];
    const compare = [
      {url: 'a', wastedMs: 100}, // no change
      {url: 'b', wastedMs: 50}, // better
      {url: 'c', wastedMs: 150}, // worse
      // url d removed
      {url: 'e', wastedMs: 100}, // added
    ];

    const diffs = getDiffs(base, compare);
    const zipped = sortZippedBaseAndCompareItems(diffs, zipBaseAndCompareItems(base, compare));

    expect(zipped).toEqual([
      {
        base: undefined,
        compare: {index: 3, item: {url: 'e', wastedMs: 100}, kind: 'compare'},
        diffs: [diffs.find(diff => diff.type === 'itemAddition')],
      },
      {
        base: {index: 2, item: {url: 'c', wastedMs: 100}, kind: 'base'},
        compare: {index: 2, item: {url: 'c', wastedMs: 150}, kind: 'compare'},
        diffs: diffs.filter(diff => diff.compareItemIndex === 2 && diff.baseItemIndex === 2),
      },
      {
        base: {index: 3, item: {url: 'd', wastedMs: 100}, kind: 'base'},
        compare: undefined,
        diffs: [diffs.find(diff => diff.type === 'itemRemoval')],
      },
      {
        base: {index: 1, item: {url: 'b', wastedMs: 100}, kind: 'base'},
        compare: {index: 1, item: {url: 'b', wastedMs: 50}, kind: 'compare'},
        diffs: diffs.filter(diff => diff.compareItemIndex === 1 && diff.baseItemIndex === 1),
      },
      {
        base: {index: 0, item: {url: 'a', wastedMs: 100}, kind: 'base'},
        compare: {index: 0, item: {url: 'a', wastedMs: 100}, kind: 'compare'},
        diffs: diffs.filter(diff => diff.compareItemIndex === 0 && diff.baseItemIndex === 0),
      },
    ]);
  });

  it('should sort within a RowLabel by numeric value', () => {
    const base = [
      {url: 'a', wastedMs: 100},
      {url: 'b', wastedMs: 100},
      {url: 'c', wastedMs: 100},
      {url: 'd', wastedMs: 100},
    ];
    const compare = [
      {url: 'a', wastedMs: 110},
      {url: 'b', wastedMs: 950},
      {url: 'c', wastedMs: 250},
      {url: 'd', wastedMs: 101},
    ];

    const zipped = sortZippedBaseAndCompareItems(
      getDiffs(base, compare),
      zipBaseAndCompareItems(base, compare)
    );

    expect(zipped).toMatchObject([
      {
        base: {index: 1, item: {url: 'b', wastedMs: 100}, kind: 'base'},
        compare: {index: 1, item: {url: 'b', wastedMs: 950}, kind: 'compare'},
      },
      {
        base: {index: 2, item: {url: 'c', wastedMs: 100}, kind: 'base'},
        compare: {index: 2, item: {url: 'c', wastedMs: 250}, kind: 'compare'},
      },
      {
        base: {index: 0, item: {url: 'a', wastedMs: 100}, kind: 'base'},
        compare: {index: 0, item: {url: 'a', wastedMs: 110}, kind: 'compare'},
      },
      {
        base: {index: 3, item: {url: 'd', wastedMs: 100}, kind: 'base'},
        compare: {index: 3, item: {url: 'd', wastedMs: 101}, kind: 'compare'},
      },
    ]);
  });

  it('should sort within a RowLabel by string value', () => {
    const base = [
      {url: 'b', node: '<br />'},
      {url: 'c', node: '<br />'},
      {url: 'a', node: '<br />'},
      {url: 'd', node: '<br />'},
    ];
    const compare = [
      {url: 'b', node: '<br />'},
      {url: 'c', node: '<br />'},
      {url: 'a', node: '<br />'},
      {url: 'd', node: '<br />'},
    ];

    const zipped = sortZippedBaseAndCompareItems(
      getDiffs(base, compare),
      zipBaseAndCompareItems(base, compare)
    );

    expect(zipped).toMatchObject([
      {
        base: {index: 2, item: {url: 'a', node: '<br />'}, kind: 'base'},
        compare: {index: 2, item: {url: 'a', node: '<br />'}, kind: 'compare'},
      },
      {
        base: {index: 0, item: {url: 'b', node: '<br />'}, kind: 'base'},
        compare: {index: 0, item: {url: 'b', node: '<br />'}, kind: 'compare'},
      },
      {
        base: {index: 1, item: {url: 'c', node: '<br />'}, kind: 'base'},
        compare: {index: 1, item: {url: 'c', node: '<br />'}, kind: 'compare'},
      },
      {
        base: {index: 3, item: {url: 'd', node: '<br />'}, kind: 'base'},
        compare: {index: 3, item: {url: 'd', node: '<br />'}, kind: 'compare'},
      },
    ]);
  });
});

describe('#synthesizeItemKeyDiffs', () => {
  it('should do nothing for existing diffs', () => {
    const baseItems = [{url: 'a', propA: 10, propB: 3}];
    const compareItems = [{url: 'a', propA: 5, propB: 6}];
    const originalDiffs = findAuditDiffs(
      {id: 'foo', score: 0.5, numericValue: 500, details: {items: baseItems}},
      {id: 'foo', score: 1, numericValue: 10, details: {items: compareItems}}
    );

    const newDiffs = synthesizeItemKeyDiffs(originalDiffs, baseItems, compareItems);
    expect(newDiffs).toEqual([]);
  });

  it('should create new item key diffs from itemAddition', () => {
    const baseItems = [];
    const compareItems = [{url: 'b', propA: 5, propB: 6}];
    const originalDiffs = findAuditDiffs(
      {id: 'foo', score: 1, details: {items: baseItems}},
      {id: 'foo', score: 1, details: {items: compareItems}}
    );

    const newDiffs = synthesizeItemKeyDiffs(originalDiffs, baseItems, compareItems);
    expect(newDiffs).toEqual([
      {
        auditId: 'foo',
        baseItemIndex: undefined,
        baseValue: 0,
        compareItemIndex: 0,
        compareValue: 5,
        itemKey: 'propA',
        type: 'itemDelta',
      },
      {
        auditId: 'foo',
        baseItemIndex: undefined,
        baseValue: 0,
        compareItemIndex: 0,
        compareValue: 6,
        itemKey: 'propB',
        type: 'itemDelta',
      },
    ]);
  });

  it('should create new item key diffs from itemRemoval', () => {
    const baseItems = [{url: 'a', propA: 1, propB: 2}];
    const compareItems = [];
    const originalDiffs = findAuditDiffs(
      {id: 'foo', score: 1, details: {items: baseItems}},
      {id: 'foo', score: 1, details: {items: compareItems}}
    );

    const newDiffs = synthesizeItemKeyDiffs(originalDiffs, baseItems, compareItems);
    expect(newDiffs).toEqual([
      {
        auditId: 'foo',
        baseItemIndex: 0,
        baseValue: 1,
        compareItemIndex: undefined,
        compareValue: 0,
        itemKey: 'propA',
        type: 'itemDelta',
      },
      {
        auditId: 'foo',
        baseItemIndex: 0,
        baseValue: 2,
        compareItemIndex: undefined,
        compareValue: 0,
        itemKey: 'propB',
        type: 'itemDelta',
      },
    ]);
  });
});

describe('#replaceNondeterministicStrings', () => {
  it('should work on non-replacements', () => {
    expect(replaceNondeterministicStrings('nonsense')).toEqual('nonsense');
    expect(replaceNondeterministicStrings('Other')).toEqual('Other');
    expect(replaceNondeterministicStrings('Unknown')).toEqual('Unknown');
    expect(replaceNondeterministicStrings('Is it real?')).toEqual('Is it real?');
    expect(replaceNondeterministicStrings('foo.notahash.js')).toEqual('foo.notahash.js');
    expect(replaceNondeterministicStrings('foo.js')).toEqual('foo.js');
    expect(replaceNondeterministicStrings('at foo.js:1234')).toEqual('at foo.js:1234');
    expect(replaceNondeterministicStrings('http almost a URL?')).toEqual('http almost a URL?');
    expect(replaceNondeterministicStrings('http://localhost/foo')).toEqual('http://localhost/foo');
    expect(replaceNondeterministicStrings('data:image/png;base64,abcdef')).toEqual(
      'data:image/png;base64,abcdef'
    );
  });

  it('should replace querystrings', () => {
    expect(replaceNondeterministicStrings('http://localhost/foo?bar=1#baz')).toEqual(
      'http://localhost/foo#baz'
    );
  });

  it('should replace YouTube embeds', () => {
    expect(
      replaceNondeterministicStrings('/yts/jsbin/www-embed-player-vfl7uF46t/www-embed-player.js')
    ).toEqual('/yts/jsbin/www-embed-player/www-embed-player.js');
    expect(replaceNondeterministicStrings('/yts/jsbin/player_ias-vflyrg3IP/en_US/base.js')).toEqual(
      '/yts/jsbin/player_ias/en_US/base.js'
    );
  });

  it('should replace hash parts', () => {
    expect(replaceNondeterministicStrings('foo-123456.js')).toEqual('foo-HASH.js');
    expect(replaceNondeterministicStrings('foo.12345678.js')).toEqual('foo.HASH.js');
    expect(replaceNondeterministicStrings('foo.abcdef12.woff2')).toEqual('foo.HASH.woff2');
    expect(replaceNondeterministicStrings('foo-abcdef12.css')).toEqual('foo-HASH.css');
  });

  it('should replace ports', () => {
    expect(replaceNondeterministicStrings('http://localhost:1337/foo?bar=1#baz')).toEqual(
      'http://localhost:PORT/foo#baz'
    );
  });

  it('should replace uuids', () => {
    expect(
      replaceNondeterministicStrings('<a href="/app/12345678-1234-1234-1234-123456781234">Text</a>')
    ).toEqual('<a href="/app/UUID">Text</a>');
  });
});

describe('#normalizeDetails', () => {
  it('should normalize checklist details', () => {
    const audit = {
      id: 'document-latency-insight',
      score: 0.5,
      details: {
        type: 'checklist',
        items: {
          noRedirects: {label: 'Avoids redirects', value: true},
          usesCompression: {label: 'Applies text compression', value: false},
        },
      },
    };

    expect(normalizeDetails(audit)).toEqual({
      headings: [
        {key: 'check', valueType: 'text', label: 'Checklist'},
        {key: 'value', valueType: 'text', label: ''},
      ],
      items: [
        {name: 'noRedirects:true', check: 'Avoids redirects', value: 'Pass'},
        {name: 'usesCompression:false', check: 'Applies text compression', value: 'Fail'},
      ],
    });
  });

  it('should normalize list details with table, checklist, node, and list-section items', () => {
    const audit = {
      id: 'lcp-breakdown-insight',
      score: 0.5,
      details: {
        type: 'list',
        items: [
          {
            type: 'list-section',
            title: 'Phases',
            value: {
              type: 'table',
              headings: [
                {key: 'label', valueType: 'text', label: 'Phase'},
                {key: 'duration', valueType: 'ms', label: 'Duration'},
              ],
              items: [
                {phase: 'timeToFirstByte', label: 'Time to first byte', duration: 500},
                {phase: 'elementRenderDelay', label: 'Element render delay', duration: 1200},
              ],
            },
          },
          {
            type: 'node',
            lhId: 'page-0-H2',
            path: '1,HTML,1,BODY,0,H2',
            snippet: '<h2>Heading</h2>',
          },
        ],
      },
    };

    expect(normalizeDetails(audit)).toEqual({
      headings: [
        {key: 'label', valueType: 'text', label: 'Phase'},
        {key: 'duration', valueType: 'ms', label: 'Duration'},
        {key: 'node', valueType: 'node', label: 'Element'},
      ],
      items: [
        {phase: 'timeToFirstByte', label: 'Time to first byte', duration: 500},
        {phase: 'elementRenderDelay', label: 'Element render delay', duration: 1200},
        {
          node: {
            type: 'node',
            lhId: 'page-0-H2',
            path: '1,HTML,1,BODY,0,H2',
            snippet: '<h2>Heading</h2>',
          },
        },
      ],
    });
  });

  it('should find diffs for checklist and list audits', () => {
    const baseChecklist = {
      id: 'document-latency-insight',
      score: 0.5,
      details: {
        type: 'checklist',
        items: {
          noRedirects: {label: 'Avoids redirects', value: true},
          usesCompression: {label: 'Applies text compression', value: true},
        },
      },
    };
    const compareChecklist = {
      id: 'document-latency-insight',
      score: 0.5,
      details: {
        type: 'checklist',
        items: {
          noRedirects: {label: 'Avoids redirects', value: true},
          usesCompression: {label: 'Applies text compression', value: false},
        },
      },
    };

    expect(findAuditDiffs(baseChecklist, compareChecklist)).toEqual([
      {
        auditId: 'document-latency-insight',
        type: 'itemRemoval',
        baseItemIndex: 1,
      },
      {
        auditId: 'document-latency-insight',
        type: 'itemAddition',
        compareItemIndex: 1,
      },
    ]);

    const baseList = {
      id: 'lcp-breakdown-insight',
      score: 0.5,
      details: {
        type: 'list',
        items: [
          {
            type: 'table',
            headings: [
              {key: 'label', valueType: 'text', label: 'Phase'},
              {key: 'duration', valueType: 'ms', label: 'Duration'},
            ],
            items: [{label: 'Time to first byte', duration: 500}],
          },
        ],
      },
    };
    const compareList = {
      id: 'lcp-breakdown-insight',
      score: 0.5,
      details: {
        type: 'list',
        items: [
          {
            type: 'table',
            headings: [
              {key: 'label', valueType: 'text', label: 'Phase'},
              {key: 'duration', valueType: 'ms', label: 'Duration'},
            ],
            items: [{label: 'Time to first byte', duration: 800}],
          },
        ],
      },
    };

    expect(findAuditDiffs(baseList, compareList)).toEqual([
      {
        auditId: 'lcp-breakdown-insight',
        type: 'itemDelta',
        itemKey: 'duration',
        baseItemIndex: 0,
        compareItemIndex: 0,
        baseValue: 500,
        compareValue: 800,
      },
    ]);
  });
});

describe('#diffAndSortSubItems', () => {
  it('should extract subItems from both array and {type: subitems, items} shapes', () => {
    expect(getSubItems(undefined)).toEqual([]);
    expect(getSubItems({})).toEqual([]);
    expect(getSubItems({subItems: [{a: 1}]})).toEqual([{a: 1}]);
    expect(getSubItems({subItems: {type: 'subitems', items: [{b: 2}]}})).toEqual([{b: 2}]);
  });

  it('should map headings to subItemsHeading and fallback to __self for 1D subitems', () => {
    const structuredHeadings = [
      {
        key: 'entity',
        valueType: 'text',
        subItemsHeading: {key: 'url', valueType: 'url'},
      },
      {
        key: 'transferSize',
        valueType: 'bytes',
        subItemsHeading: {key: 'transferSize'},
      },
    ];
    expect(getSubItemHeadings(structuredHeadings)).toEqual([
      {key: 'url', valueType: 'url'},
      {key: 'transferSize', valueType: 'bytes'},
    ]);

    const unmappedHeadings = [
      {key: 'value', valueType: 'text'},
      {key: 'source', valueType: 'source-location'},
    ];
    expect(getSubItemHeadings(unmappedHeadings)).toEqual([
      {key: '__self', valueType: 'text', isSelfValue: true},
      {key: null, valueType: 'unknown'},
    ]);
  });

  it('should pair, diff, and sort subitems across matched parent items', () => {
    const headings = [
      {key: 'entity', valueType: 'text', subItemsHeading: {key: 'url', valueType: 'url'}},
      {key: 'transferSize', valueType: 'bytes', subItemsHeading: {key: 'transferSize'}},
      {key: 'blockingTime', valueType: 'ms', subItemsHeading: {key: 'blockingTime'}},
    ];
    const baseItem = {
      entity: 'Hubspot',
      transferSize: 3000,
      blockingTime: 50,
      subItems: {
        type: 'subitems',
        items: [
          {url: 'https://example.com/unchanged.js', transferSize: 1000, blockingTime: 0},
          {url: 'https://example.com/worse.js', transferSize: 1000, blockingTime: 20},
          {url: 'https://example.com/removed.js', transferSize: 1000, blockingTime: 30},
        ],
      },
    };
    const compareItem = {
      entity: 'Hubspot',
      transferSize: 3500,
      blockingTime: 100,
      subItems: {
        type: 'subitems',
        items: [
          {url: 'https://example.com/unchanged.js', transferSize: 1000, blockingTime: 0},
          {url: 'https://example.com/worse.js', transferSize: 1500, blockingTime: 60},
          {url: 'https://example.com/added.js', transferSize: 1000, blockingTime: 40},
        ],
      },
    };

    const {sortedSubItems} = diffAndSortSubItems(
      'third-party-summary',
      baseItem,
      compareItem,
      headings
    );

    expect(sortedSubItems.map(s => s.state)).toEqual(['added', 'worse', 'removed', 'no change']);
    expect(sortedSubItems[0].compare.item.url).toBe('https://example.com/added.js');
    expect(sortedSubItems[1].compare.item.url).toBe('https://example.com/worse.js');
    expect(sortedSubItems[2].base.item.url).toBe('https://example.com/removed.js');
    expect(sortedSubItems[3].compare.item.url).toBe('https://example.com/unchanged.js');
  });

  it('should synthesize numeric diffs without redundant added/removed labels when parent is added', () => {
    const headings = [
      {key: 'entity', valueType: 'text', subItemsHeading: {key: 'url', valueType: 'url'}},
      {key: 'transferSize', valueType: 'bytes', subItemsHeading: {key: 'transferSize'}},
    ];
    const compareItem = {
      entity: 'YouTube',
      transferSize: 3000,
      subItems: {
        type: 'subitems',
        items: [
          {url: 'https://youtube.com/small.js', transferSize: 500},
          {url: 'https://youtube.com/large.js', transferSize: 2500},
        ],
      },
    };

    const {sortedSubItems} = diffAndSortSubItems(
      'third-party-summary',
      undefined,
      compareItem,
      headings
    );

    // Sorted by worst numeric delta (2500 first, then 500), with state 'no change' so "added" isn't repeated
    expect(sortedSubItems).toHaveLength(2);
    expect(sortedSubItems[0].compare.item.url).toBe('https://youtube.com/large.js');
    expect(sortedSubItems[0].state).toBe('no change');
    expect(sortedSubItems[0].diffs).toEqual([
      {
        auditId: 'third-party-summary',
        type: 'itemDelta',
        itemKey: 'transferSize',
        baseItemIndex: undefined,
        compareItemIndex: 1,
        baseValue: 0,
        compareValue: 2500,
      },
    ]);
  });

  it('should handle added/removed parent rows with duplicate-key subitems without ghost rows', () => {
    const headings = [
      {key: 'entity', valueType: 'text', subItemsHeading: {key: 'url', valueType: 'url'}},
      {key: 'transferSize', valueType: 'bytes', subItemsHeading: {key: 'transferSize'}},
    ];
    // Both font URLs strip query strings to the same `https://fonts.googleapis.com/css2` key
    const compareItem = {
      entity: 'Google Fonts',
      transferSize: 3000,
      subItems: {
        type: 'subitems',
        items: [
          {url: 'https://fonts.googleapis.com/css2?family=Inter', transferSize: 1000},
          {url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono', transferSize: 2000},
        ],
      },
    };

    const {sortedSubItems: addedSubItems} = diffAndSortSubItems(
      'third-parties-insight',
      undefined,
      compareItem,
      headings
    );
    expect(addedSubItems).toHaveLength(2);
    expect(addedSubItems.every(s => s.compare && !s.base)).toBe(true);
    expect(addedSubItems[0].compare.item.url).toContain('IBM+Plex+Mono');
    expect(addedSubItems[1].compare.item.url).toContain('Inter');

    // Removed parent row (`compareItem = undefined`)
    const {sortedSubItems: removedSubItems} = diffAndSortSubItems(
      'third-parties-insight',
      compareItem,
      undefined,
      headings
    );
    expect(removedSubItems).toHaveLength(2);
    expect(removedSubItems.every(s => s.base && !s.compare)).toBe(true);
    expect(removedSubItems[0].diffs[0]).toMatchObject({
      baseItemIndex: 0,
      baseValue: 1000,
      compareValue: 0,
    });
  });

  it('should not synthesize regression diffs in single-report mode (hasBaseAudit: false)', () => {
    const headings = [
      {key: 'entity', valueType: 'text', subItemsHeading: {key: 'url', valueType: 'url'}},
      {key: 'transferSize', valueType: 'bytes', subItemsHeading: {key: 'transferSize'}},
    ];
    const compareItem = {
      entity: 'YouTube',
      transferSize: 2500,
      subItems: {
        type: 'subitems',
        items: [{url: 'https://youtube.com/base.js', transferSize: 2500}],
      },
    };

    const {sortedSubItems} = diffAndSortSubItems(
      'third-party-summary',
      undefined,
      compareItem,
      headings,
      {hasBaseAudit: false}
    );
    expect(sortedSubItems).toHaveLength(1);
    expect(sortedSubItems[0].diffs).toEqual([]);
  });

  it('should pair legacy-javascript subitems by signal even when bundle line/col shifts', () => {
    const headings = [
      {
        key: 'url',
        valueType: 'url',
        subItemsHeading: {key: 'location', valueType: 'source-location'},
      },
      {key: null, valueType: 'code', subItemsHeading: {key: 'signal'}},
    ];
    const baseItem = {
      url: 'https://example.com/bundle.js',
      subItems: {
        type: 'subitems',
        items: [
          {
            signal: 'Array.prototype.includes',
            location: {
              type: 'source-location',
              url: 'https://example.com/bundle.js',
              line: 1,
              column: 100,
            },
          },
        ],
      },
    };
    const compareItem = {
      url: 'https://example.com/bundle.js',
      subItems: {
        type: 'subitems',
        items: [
          {
            signal: 'Array.prototype.includes',
            location: {
              type: 'source-location',
              url: 'https://example.com/bundle.js',
              line: 1,
              column: 250,
            },
          },
        ],
      },
    };

    const {sortedSubItems} = diffAndSortSubItems(
      'legacy-javascript',
      baseItem,
      compareItem,
      headings
    );
    expect(sortedSubItems).toHaveLength(1);
    expect(sortedSubItems[0].state).toBe('no change');
  });

  it('should merge subItemsHeading across headings in mergeHeadings and list normalizeDetails', () => {
    const merged = mergeHeadings(
      [{key: 'origin', valueType: 'text', label: 'Origin'}],
      [{key: 'origin', valueType: 'text', label: 'Origin', subItemsHeading: {key: 'warning'}}]
    );
    expect(merged).toEqual([
      {key: 'origin', valueType: 'text', label: 'Origin', subItemsHeading: {key: 'warning'}},
    ]);
  });
});
