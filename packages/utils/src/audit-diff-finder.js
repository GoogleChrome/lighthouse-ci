/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

/** @typedef {'improvement'|'neutral'|'regression'} DiffLabel */
/** @typedef {'better'|'worse'|'added'|'removed'|'ambiguous'|'no change'} RowLabel */
/** @typedef {{item: Record<string, any>, kind?: string, index: number}} DetailItemEntry */

/**
 * @param {number} delta
 * @param {'audit'|'score'} deltaType
 * @return {DiffLabel}
 */
function getDeltaLabel(delta, deltaType = 'audit') {
  if (delta === 0) return 'neutral';
  let isImprovement = delta < 0;
  if (deltaType === 'score') isImprovement = delta > 0;
  return isImprovement ? 'improvement' : 'regression';
}

/**
 * @param {LHCI.AuditDiff} diff
 * @return {DiffLabel}
 */
function getDiffLabel(diff) {
  switch (diff.type) {
    case 'error':
      return 'regression';
    case 'score':
      return getDeltaLabel(getDeltaStats(diff).delta, 'score');
    case 'numericValue':
    case 'itemCount':
    case 'itemDelta':
      return getDeltaLabel(getDeltaStats(diff).delta, 'audit');
    case 'itemAddition':
      return 'regression';
    case 'itemRemoval':
      return 'improvement';
    default:
      return 'neutral';
  }
}

/**
 * Given the array of diffs for a particular row, determine its label.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @return {RowLabel}
 */
function getRowLabel(diffs) {
  if (!diffs.length) return 'no change';

  if (diffs.some(diff => diff.type === 'itemAddition')) return 'added';
  if (diffs.some(diff => diff.type === 'itemRemoval')) return 'removed';

  const itemDeltaDiffs = diffs.filter(
    /** @return {diff is LHCI.NumericItemAuditDiff} */ diff => diff.type === 'itemDelta'
  );

  // All the diffs were worse, it's "worse".
  if (itemDeltaDiffs.every(diff => diff.compareValue > diff.baseValue)) return 'worse';
  // All the diffs were better, it's "better".
  if (itemDeltaDiffs.every(diff => diff.compareValue < diff.baseValue)) return 'better';
  // The item had diffs but some were better and some were worse, so we can't decide.
  if (itemDeltaDiffs.length) return 'ambiguous';

  return 'no change';
}

/**
 * Given the array of all diffs for an audit, determine the label for a row with particular item index.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {RowLabel}
 */
function getRowLabelForIndex(diffs, compareItemIndex, baseItemIndex) {
  const matchingDiffs = diffs.filter(diff => {
    const compareIndex = 'compareItemIndex' in diff ? diff.compareItemIndex : undefined;
    const baseIndex = 'baseItemIndex' in diff ? diff.baseItemIndex : undefined;
    if (typeof compareIndex === 'number') return compareIndex === compareItemIndex;
    if (typeof baseIndex === 'number') return baseIndex === baseItemIndex;
    return false;
  });

  return getRowLabel(matchingDiffs);
}

/** @param {Array<DiffLabel>} labels @return {DiffLabel} */
function getMostSevereDiffLabel(labels) {
  if (labels.some(l => l === 'regression')) return 'regression';
  if (labels.some(l => l === 'neutral')) return 'neutral';
  return 'improvement';
}

/**
 * @param {LHCI.AuditDiff} diff
 * @return {diff is LHCI.NumericAuditDiff|LHCI.NumericItemAuditDiff} */
function isNumericAuditDiff(diff) {
  return ['score', 'numericValue', 'itemCount', 'itemDelta'].includes(diff.type);
}

/** @param {number|null|undefined} score */
function getScoreLevel(score) {
  if (typeof score !== 'number') return 'error';
  if (score >= 0.9) return 'pass';
  if (score >= 0.5) return 'average';
  return 'fail';
}

/** @param {LHCI.AuditDiff} diff */
function getDiffSeverity(diff) {
  const delta = isNumericAuditDiff(diff) ? getDeltaStats(diff).absoluteDelta : 0;
  if (diff.type === 'error') return 1e12;
  if (diff.type === 'score') return 1e10 * delta;
  if (diff.type === 'numericValue') return 1e8 * Math.max(delta / 1000, 1);
  if (diff.type === 'itemCount') return 1e6 * delta;
  if (diff.type === 'itemAddition') return 1e5;
  if (diff.type === 'itemRemoval') return 1e5;
  if (diff.type === 'itemDelta') return Math.min(Math.max(delta / 100, 1), 1e5 - 1);
  return 0;
}

/**
 * @param {LHCI.NumericAuditDiff | LHCI.NumericItemAuditDiff} diff
 */
function getDeltaStats(diff) {
  const {baseValue, compareValue} = diff;
  const delta = compareValue - baseValue;
  const absoluteDelta = Math.abs(delta);
  // Handle the 0 case to avoid messy NaN handling.
  if (delta === 0) return {delta, absoluteDelta, percentDelta: 0, percentAbsoluteDelta: 0};

  // Percent delta is `delta / baseValue` unless `baseValue == 0`.
  // Then `percentDelta` is 100% by arbitrary convention (instead of Infinity/NaN).
  const percentDelta = baseValue ? delta / baseValue : 1;
  const percentAbsoluteDelta = Math.abs(percentDelta);

  return {
    delta,
    absoluteDelta,
    percentDelta,
    percentAbsoluteDelta,
  };
}

/**
 * @param {{auditId: string, type: LHCI.AuditDiffType, baseValue?: number|null, compareValue?: number|null, itemKey?: string, baseItemIndex?: number, compareItemIndex?: number}} diff
 * @return {LHCI.AuditDiff}
 */
function createAuditDiff(diff) {
  const {auditId, type, baseValue, compareValue, baseItemIndex, compareItemIndex, itemKey} = diff;
  if (type === 'itemAddition') {
    if (typeof compareItemIndex !== 'number') throw new Error('compareItemIndex is not set');
    return {auditId, type, compareItemIndex};
  }

  if (type === 'itemRemoval') {
    if (typeof baseItemIndex !== 'number') throw new Error('baseItemIndex is not set');
    return {auditId, type, baseItemIndex};
  }

  if (type === 'displayValue') {
    throw new Error('Do not use createAuditDiff for displayValue, just manually create');
  }

  if (
    typeof compareValue !== 'number' ||
    typeof baseValue !== 'number' ||
    !Number.isFinite(baseValue) ||
    !Number.isFinite(compareValue) ||
    type === 'error'
  ) {
    return {
      auditId,
      type: 'error',
      attemptedType: type,
      baseValue: baseValue || NaN,
      compareValue: compareValue || NaN,
    };
  }

  /** @type {LHCI.NumericAuditDiff} */
  const numericDiffResult = {
    auditId,
    type: 'score',
    baseValue,
    compareValue,
  };

  if (type === 'itemDelta') {
    if (typeof baseItemIndex !== 'number') throw new Error('baseItemIndex is not set');
    if (typeof compareItemIndex !== 'number') throw new Error('compareItemIndex is not set');
    if (typeof itemKey !== 'string') throw new Error('itemKey is not set');

    return {
      ...numericDiffResult,
      type: 'itemDelta',
      baseItemIndex,
      compareItemIndex,
      itemKey,
    };
  }

  return {...numericDiffResult, type};
}

/**
 *
 * @param {string} auditId
 * @param {DetailItemEntry} baseEntry
 * @param {DetailItemEntry} compareEntry
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemKeyDiffs(auditId, baseEntry, compareEntry) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const key of Object.keys(baseEntry.item)) {
    const baseValue = baseEntry.item[key];
    const compareValue = compareEntry.item[key];
    if (typeof baseValue !== 'number' || typeof compareValue !== 'number') continue;

    diffs.push(
      createAuditDiff({
        auditId,
        type: 'itemDelta',
        itemKey: key,
        baseItemIndex: baseEntry.index,
        compareItemIndex: compareEntry.index,
        baseValue,
        compareValue,
      })
    );
  }

  return diffs;
}
/**
 * TODO: consider doing more than URL-based comparisons.
 *
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>}
 */
function zipBaseAndCompareItems(baseItems, compareItems) {
  const groupedByKey = _.groupIntoMap(
    [
      ...baseItems.map((item, i) => ({item, kind: 'base', index: i})),
      ...compareItems.map((item, i) => ({item, kind: 'compare', index: i})),
    ],
    entry => (entry.item.url === undefined ? JSON.stringify(entry.item) : entry.item.url)
  );

  /** @type {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>} */
  const zipped = [];

  for (const entries of groupedByKey.values()) {
    const baseItems = entries.filter(entry => entry.kind === 'base');
    const compareItems = entries.filter(entry => entry.kind === 'compare');

    if (baseItems.length > 1 || compareItems.length > 1) {
      // The key is not actually unique, just treat all as added/removed.
      for (const entry of entries) {
        zipped.push({[entry.kind]: entry});
      }

      continue;
    }

    zipped.push({base: baseItems[0], compare: compareItems[0]});
  }

  return zipped;
}

/**
 * @param {string} auditId
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemsDiffs(auditId, baseItems, compareItems) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const {base, compare} of zipBaseAndCompareItems(baseItems, compareItems)) {
    if (base && compare) {
      diffs.push(...findAuditDetailItemKeyDiffs(auditId, base, compare));
    } else if (compare) {
      diffs.push({type: 'itemAddition', auditId, compareItemIndex: compare.index});
    } else if (base) {
      diffs.push({type: 'itemRemoval', auditId, baseItemIndex: base.index});
    } else {
      throw new Error('Impossible');
    }
  }

  return diffs;
}

/**
 * @param {LH.AuditResult} audit
 */
function normalizeScore(audit) {
  if (audit.scoreDisplayMode === 'notApplicable') {
    // notApplicable should be treated as passing.
    return 1;
  }

  if (audit.scoreDisplayMode === 'informative') {
    // informative should be treated as failing.
    return 0;
  }

  return audit.score;
}

/**
 * @param {LH.AuditResult} audit
 */
function getNumericValue(audit) {
  if (
    typeof audit.numericValue !== 'number' &&
    audit.details &&
    typeof audit.details.overallSavingsMs === 'number'
  ) {
    return audit.details.overallSavingsMs;
  }

  return audit.numericValue;
}

/**
 * @param {LH.AuditResult} audit
 */
function normalizeNumericValue(audit) {
  if (audit.scoreDisplayMode === 'notApplicable') {
    return 0;
  }

  return getNumericValue(audit);
}

/**
 * @param {LH.AuditResult} audit
 */
function normalizeDetailsItems(audit) {
  return (audit.details && audit.details.items) || [];
}

/**
 * @param {LH.AuditResult} baseAudit
 * @param {LH.AuditResult} compareAudit
 * @param {{forceAllScoreDiffs?: boolean, skipDisplayValueDiffs?: boolean, percentAbsoluteDeltaThreshold?: number}} options
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDiffs(baseAudit, compareAudit, options = {}) {
  const auditId = baseAudit.id || '';
  const {percentAbsoluteDeltaThreshold = 0} = options;
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  if (typeof baseAudit.score === 'number' || typeof compareAudit.score === 'number') {
    diffs.push(
      createAuditDiff({
        auditId,
        type: 'score',
        baseValue: normalizeScore(baseAudit),
        compareValue: normalizeScore(compareAudit),
      })
    );
  }

  if (
    typeof getNumericValue(baseAudit) === 'number' ||
    typeof getNumericValue(compareAudit) === 'number'
  ) {
    diffs.push(
      createAuditDiff({
        auditId,
        type: 'numericValue',
        baseValue: normalizeNumericValue(baseAudit),
        compareValue: normalizeNumericValue(compareAudit),
      })
    );
  }

  if (typeof baseAudit.displayValue === 'string' || typeof compareAudit.displayValue === 'string') {
    diffs.push({
      auditId,
      type: 'displayValue',
      baseValue: baseAudit.displayValue || '',
      compareValue: compareAudit.displayValue || '',
    });
  }

  if (
    (baseAudit.details && baseAudit.details.items) ||
    (compareAudit.details && compareAudit.details.items)
  ) {
    const baseItems = normalizeDetailsItems(baseAudit);
    const compareItems = normalizeDetailsItems(compareAudit);

    diffs.push(
      createAuditDiff({
        auditId,
        type: 'itemCount',
        baseValue: baseItems.length,
        compareValue: compareItems.length,
      })
    );

    diffs.push(...findAuditDetailItemsDiffs(auditId, baseItems, compareItems));
  }

  return diffs.filter(diff => {
    // Errors are always surfaced.
    if (diff.type === 'error') return true;
    // Additions and removals are always surfaced.
    if (diff.type === 'itemAddition' || diff.type === 'itemRemoval') return true;
    // If it's a score and we're not forcing all score diffs, only flag level changes.
    if (diff.type === 'score' && !options.forceAllScoreDiffs) {
      return getScoreLevel(diff.baseValue) !== getScoreLevel(diff.compareValue);
    }
    // If it's a display value change, ensure the values are different, and defer to the options.
    if (diff.type === 'displayValue') {
      return diff.baseValue !== diff.compareValue && !options.skipDisplayValueDiffs;
    }

    // Ensure the percent delta is above our threshold (0 by default).
    return getDeltaStats(diff).percentAbsoluteDelta > percentAbsoluteDeltaThreshold;
  });
}

module.exports = {
  findAuditDiffs,
  getDiffSeverity,
  getDeltaLabel,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
  getMostSevereDiffLabel,
  zipBaseAndCompareItems,
};
