/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');
const {getGroupForAuditId} = require('./seed-data/lhr-generator.js');

/** @typedef {'improvement'|'neutral'|'regression'} DiffLabel */
/** @typedef {'better'|'worse'|'added'|'removed'|'ambiguous'|'no change'} RowLabel */
/** @typedef {{item: Record<string, any>, kind?: string, index: number}} DetailItemEntry */

// Hardcoded audit ids that arent worth diffing and generally regress the UX when done.
const auditsToNotDIff = ['main-thread-tasks', 'screenshot-thumbnails', 'metrics'];

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
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {Array<LHCI.AuditDiff>}
 */
function getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex) {
  return diffs.filter(diff => {
    const compareIndex = 'compareItemIndex' in diff ? diff.compareItemIndex : undefined;
    const baseIndex = 'baseItemIndex' in diff ? diff.baseItemIndex : undefined;
    if (typeof compareIndex === 'number') return compareIndex === compareItemIndex;
    if (typeof baseIndex === 'number') return baseIndex === baseItemIndex;
    return false;
  });
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
  return getRowLabel(getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex));
}

/**
 * Given the array of all diffs for an audit, determine the worst numeric delta for a particular row.
 * Used for sorting.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {number|undefined}
 */
function getWorstNumericDeltaForIndex(diffs, compareItemIndex, baseItemIndex) {
  const matchingDiffs = getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex);
  const numericDiffs = matchingDiffs.filter(isNumericAuditDiff);
  if (!numericDiffs.length) return undefined;
  return Math.max(...numericDiffs.map(diff => getDeltaStats(diff).delta));
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

/** @param {number|null|undefined} value @param {[number, number]} cutoffs */
function getMetricScoreLevel(value, cutoffs) {
  if (typeof value !== 'number') return 'error';
  if (value <= cutoffs[0]) return 'pass';
  if (value <= cutoffs[1]) return 'average';
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
    if (typeof itemKey !== 'string') throw new Error('itemKey is not set');
    if (typeof baseItemIndex !== 'number' && typeof compareItemIndex !== 'number') {
      throw new Error('Either baseItemIndex or compareItemIndex must be set');
    }

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
 * @param {Array<{key: string | null}>} headings
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemKeyDiffs(auditId, baseEntry, compareEntry, headings) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const key of Object.keys(baseEntry.item)) {
    const baseValue = baseEntry.item[key];
    const compareValue = compareEntry.item[key];
    // If these aren't numeric, comparable values, skip the key.
    if (typeof baseValue !== 'number' || typeof compareValue !== 'number') continue;
    // If these aren't shown in the table, skip the key.
    if (!headings.some(heading => heading.key === key)) continue;

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
 * This function creates NumericItemAuditDiffs from itemAddition/itemRemoved diffs. Normally, these
 * are superfluous data, but in some instances (table details views for example), it's desirable to
 * understand the diff state of each individual itemKey. The missing values are assumed to be 0
 * for the purposes of the diff.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<LHCI.AuditDiff>}
 */
function synthesizeItemKeyDiffs(diffs, baseItems, compareItems) {
  /** @type {Array<LHCI.AuditDiff>} */
  const itemKeyDiffs = [];

  for (const diff of diffs) {
    if (diff.type !== 'itemAddition' && diff.type !== 'itemRemoval') continue;

    const item =
      diff.type === 'itemAddition'
        ? compareItems[diff.compareItemIndex]
        : baseItems[diff.baseItemIndex];

    for (const key of Object.keys(item)) {
      const baseValue = diff.type === 'itemAddition' ? 0 : item[key];
      const compareValue = diff.type === 'itemAddition' ? item[key] : 0;
      if (typeof compareValue !== 'number' || typeof baseValue !== 'number') continue;

      const itemIndexKeyName = diff.type === 'itemAddition' ? 'compareItemIndex' : 'baseItemIndex';
      const itemIndexValue =
        diff.type === 'itemAddition' ? diff.compareItemIndex : diff.baseItemIndex;
      itemKeyDiffs.push(
        createAuditDiff({
          auditId: diff.auditId,
          type: 'itemDelta',
          itemKey: key,
          [itemIndexKeyName]: itemIndexValue,
          baseValue,
          compareValue,
        })
      );
    }
  }

  return itemKeyDiffs;
}

/** @param {string} s */
function replaceNondeterministicStrings(s) {
  if (s.startsWith('http') && s.includes('?')) {
    try {
      const url = new URL(s);
      url.search = '';
      s = url.href;
    } catch (err) {}
  }

  return (
    s
      // YouTube Embeds
      .replace(/www-embed-player-[0-9a-z]+/i, 'www-embed-player')
      .replace(/player_ias-[0-9a-z]+/i, 'player_ias')
      // UUIDs
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID')
      // localhost Ports
      .replace(/:[0-9]{3,5}\//, ':PORT/')
      // Hash components embedded in filenames
      .replace(/(\.|-)[0-9a-f]{6,8}\.(js|css|woff|html|png|jpeg|jpg|svg)/i, '$1HASH.$2')
  );
}

/**
 * The items passed to this method can be dirtied by other libraries and contain circular structures.
 * Prune any private-looking properties that start with `_` throughout the entire object.
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci/issues/666
 * @param {unknown} item
 * @return {unknown}
 */
function deepPruneItemForKeySerialization(item) {
  if (typeof item !== 'object') return item;
  if (item === null) return item;

  if (Array.isArray(item)) {
    return item.map(entry => deepPruneItemForKeySerialization(entry));
  } else {
    const itemAsRecord = /** @type {Record<string, unknown>} */ (item);
    const keys = Object.keys(item);
    const keysToKeep = keys.filter(key => !key.startsWith('_'));
    /** @type {Record<string, any>} */
    const copy = {};
    for (const key of keysToKeep) {
      copy[key] = deepPruneItemForKeySerialization(itemAsRecord[key]);
    }
    return copy;
  }
}

/** @param {Record<string, any>} item @return {string} */
function getItemKey(item) {
  // Do most specific checks at the top. most general at bottom..
  //
  // For sourcemapped opportunities that identify a source location
  const source = item.source;
  if (typeof source === 'string') return source;
  if (source && source.url) return `${source.url}:${source.line}:${source.column}`;
  // For the pre-grouped audits like resource-summary
  if (typeof item.label === 'string') return item.label;
  // For the pre-grouped audits like mainthread-work-breakdown
  if (typeof item.groupLabel === 'string') return item.groupLabel;
  // For user-timings
  if (typeof item.name === 'string') return item.name;
  // For dom-size
  if (typeof item.statistic === 'string') return item.statistic;
  // For third-party-summary
  if (item.entity && typeof item.entity.text === 'string') return item.entity.text;
  // For node
  if (typeof item.node?.path === 'string') return item.node.path;
  // Tap-targets
  if (
    typeof item.tapTarget?.path === 'string' &&
    typeof item.overlappingTarget?.path === 'string'
  ) {
    return `${item.tapTarget.path} + ${item.overlappingTarget.path}`;
  }
  // For most opportunities, diagnostics, etc where 1 row === 1 resource
  if (typeof item.url === 'string' && item.url) return item.url;
  if (typeof item.origin === 'string' && item.origin) return item.origin;

  // For everything else, use the entire object, actually works OK on most nodes.
  return JSON.stringify(deepPruneItemForKeySerialization(item));
}

/**
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
    entry => replaceNondeterministicStrings(getItemKey(entry.item))
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
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>} zippedItems
 * @return {Array<{base?: DetailItemEntry, compare?: DetailItemEntry, diffs: Array<LHCI.AuditDiff>}>}
 */
function sortZippedBaseAndCompareItems(diffs, zippedItems) {
  /** @type {Array<RowLabel>} */
  const rowLabelSortOrder = ['added', 'worse', 'ambiguous', 'removed', 'better', 'no change'];

  return zippedItems
    .map(item => {
      return {
        ...item,
        diffs: getMatchingDiffsForIndex(
          diffs,
          item.compare && item.compare.index,
          item.base && item.base.index
        ),
      };
    })
    .sort((a, b) => {
      const compareIndexA = a.compare && a.compare.index;
      const baseIndexA = a.base && a.base.index;
      const compareIndexB = b.compare && b.compare.index;
      const baseIndexB = b.base && b.base.index;

      const rowStateIndexA = rowLabelSortOrder.indexOf(
        getRowLabelForIndex(diffs, compareIndexA, baseIndexA)
      );
      const rowStateIndexB = rowLabelSortOrder.indexOf(
        getRowLabelForIndex(diffs, compareIndexB, baseIndexB)
      );

      const labelValueA = getItemKey(
        (a.compare && a.compare.item) || (a.base && a.base.item) || {}
      );
      const labelValueB = getItemKey(
        (b.compare && b.compare.item) || (b.base && b.base.item) || {}
      );

      const numericValueA = getWorstNumericDeltaForIndex(diffs, compareIndexA, baseIndexA);
      const numericValueB = getWorstNumericDeltaForIndex(diffs, compareIndexB, baseIndexB);

      if (rowStateIndexA === rowStateIndexB) {
        return typeof numericValueA === 'number' && typeof numericValueB === 'number'
          ? numericValueB - numericValueA
          : labelValueA.localeCompare(labelValueB);
      }
      return rowStateIndexA - rowStateIndexB;
    });
}

/**
 * @param {string} auditId
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @param {Array<{key: string | null}>} headings
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemsDiffs(auditId, baseItems, compareItems, headings) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const {base, compare} of zipBaseAndCompareItems(baseItems, compareItems)) {
    if (base && compare) {
      diffs.push(...findAuditDetailItemKeyDiffs(auditId, base, compare, headings));
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
 * @return {Required<Pick<Required<LH.AuditResult>['details'],'items'|'headings'>>}
 */
function normalizeDetails(audit) {
  if (!audit.details) return {items: [], headings: []};
  return {items: audit.details.items || [], headings: audit.details.headings || []};
}

/**
 * @param {LH.AuditResult} baseAudit
 * @param {LH.AuditResult} compareAudit
 * @param {{forceAllScoreDiffs?: boolean, skipDisplayValueDiffs?: boolean, synthesizeItemKeyDiffs?: boolean, percentAbsoluteDeltaThreshold?: number}} options
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDiffs(baseAudit, compareAudit, options = {}) {
  const auditId = baseAudit.id || '';
  const {percentAbsoluteDeltaThreshold = 0} = options;
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  if (auditsToNotDIff.includes(auditId)) return diffs;

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

  let hasItemDetails = false;
  /** @type {Partial<LH.AuditResult['details']>} */
  const baseAuditDetails = baseAudit.details || {};
  /** @type {Partial<LH.AuditResult['details']>} */
  const compareAuditDetails = compareAudit.details || {};
  // TODO: support checklist.
  if (
    (baseAuditDetails.type !== 'debugdata' &&
      baseAuditDetails.type !== 'checklist' &&
      baseAuditDetails.items) ||
    (compareAuditDetails.type !== 'debugdata' &&
      compareAuditDetails.type !== 'checklist' &&
      compareAuditDetails.items)
  ) {
    hasItemDetails = true;
    const {items: baseItems, headings: baseHeadings} = normalizeDetails(baseAudit);
    const {items: compareItems, headings: compareHeadings} = normalizeDetails(compareAudit);
    const headings = baseHeadings.concat(compareHeadings);

    diffs.push(
      createAuditDiff({
        auditId,
        type: 'itemCount',
        baseValue: baseItems.length,
        compareValue: compareItems.length,
      })
    );

    diffs.push(...findAuditDetailItemsDiffs(auditId, baseItems, compareItems, headings));

    if (options.synthesizeItemKeyDiffs) {
      diffs.push(...synthesizeItemKeyDiffs(diffs, baseItems, compareItems));
    }
  }

  const filteredDiffs = diffs.filter(diff => {
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

  // If the only diff found was a displayValue diff, skip it as the others were probably ignored by
  // our percentAbsoluteDeltaThreshold.
  if (filteredDiffs.length === 1 && filteredDiffs[0].type === 'displayValue') return [];

  // If the only diff found was a numericValue/displayValue diff *AND* it seems like the result was flaky, skip it.
  // The result is likely flaky if the audit passed *OR* it was supposed to have details but no details items changed.
  const isAllPassing = compareAudit.score === 1 && baseAudit.score === 1;
  const group = getGroupForAuditId(auditId);
  if (
    group !== 'metrics' && // if metrics group audit is found, don't skip it
    filteredDiffs.every(diff => diff.type === 'displayValue' || diff.type === 'numericValue') &&
    (isAllPassing || hasItemDetails)
  ) {
    return [];
  }

  return filteredDiffs;
}

module.exports = {
  findAuditDiffs,
  getDiffSeverity,
  getDeltaLabel,
  getDeltaStats,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
  getMostSevereDiffLabel,
  getMetricScoreLevel,
  zipBaseAndCompareItems,
  synthesizeItemKeyDiffs,
  sortZippedBaseAndCompareItems,
  replaceNondeterministicStrings,
};
