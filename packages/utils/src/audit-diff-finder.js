/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

/** @typedef {'improvement'|'neutral'|'regression'} DiffLabel */
/** @typedef {{item: Record<string, any>, kind: string, index: number}} DetailItemEntry */

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
 * @param {string} auditId
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemsDiffs(auditId, baseItems, compareItems) {
  const groupedByUrl = _.groupIntoMap(
    [
      ...baseItems.map((item, i) => ({item, kind: 'base', index: i})),
      ...compareItems.map((item, i) => ({item, kind: 'compare', index: i})),
    ],
    entry => entry.item.url
  );

  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const [url, entries] of groupedByUrl.entries()) {
    if (typeof url !== 'string') continue;
    if (entries.length > 2) continue;

    const baseEntry = entries.find(entry => entry.kind === 'base');
    const compareEntry = entries.find(entry => entry.kind === 'compare');

    if (baseEntry && compareEntry) {
      diffs.push(...findAuditDetailItemKeyDiffs(auditId, baseEntry, compareEntry));
    } else if (compareEntry) {
      diffs.push({type: 'itemAddition', auditId, compareItemIndex: compareEntry.index});
    } else if (baseEntry) {
      diffs.push({type: 'itemRemoval', auditId, baseItemIndex: baseEntry.index});
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
 * @param {{forceAllScoreDiffs?: boolean, percentAbsoluteDeltaThreshold?: number}} options
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

    // Ensure the percent delta is above our threshold (0 by default).
    return getDeltaStats(diff).percentAbsoluteDelta > percentAbsoluteDeltaThreshold;
  });
}

module.exports = {
  findAuditDiffs,
  getDiffSeverity,
  getDeltaLabel,
  getDiffLabel,
  getMostSevereDiffLabel,
};
