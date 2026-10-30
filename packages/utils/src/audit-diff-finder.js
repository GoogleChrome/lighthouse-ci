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
 * Also prune `subItems` so parent row keys remain stable even when subitems change.
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
    const keysToKeep = keys.filter(key => !key.startsWith('_') && key !== 'subItems');
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
  // For baseline features audit (must be before source since multiple features can share a bundle location)
  if (typeof item.featureId?.text === 'string') return item.featureId.text;
  // For sourcemapped opportunities that identify a source location
  const source = item.source;
  if (typeof source === 'string') return source;
  if (source && source.url) return `${source.url}:${source.line}:${source.column}`;
  // For legacy-javascript / legacy-javascript-insight subitems (key by signal so polyfills match
  // even when minified bundle line/column numbers shift)
  if (typeof item.signal === 'string' && item.signal) return item.signal;
  if (item.location && typeof item.location.url === 'string') {
    return `${item.location.url}:${item.location.line}:${item.location.column}`;
  }
  // For the pre-grouped audits like resource-summary
  if (typeof item.label === 'string') {
    return typeof item.resourceType === 'string' ? item.resourceType : item.label;
  }
  // For the pre-grouped audits like mainthread-work-breakdown
  if (typeof item.groupLabel === 'string') {
    return typeof item.group === 'string' ? item.group : item.groupLabel;
  }
  // For user-timings
  if (typeof item.name === 'string') return item.name;
  // For dom-size
  if (typeof item.statistic === 'string') return item.statistic;
  // For node / relatedNode (accessibility subitems) / extra (layout-shifts / cls-culprits-insight)
  if (typeof item.node?.path === 'string') return item.node.path;
  if (typeof item.relatedNode?.path === 'string') return item.relatedNode.path;
  if (typeof item.extra?.path === 'string') return item.extra.path;
  if (typeof item.extra?.value === 'string') return item.extra.value;
  // Tap-targets
  if (
    typeof item.tapTarget?.path === 'string' &&
    typeof item.overlappingTarget?.path === 'string'
  ) {
    return `${item.tapTarget.path} + ${item.overlappingTarget.path}`;
  }
  // For most opportunities, diagnostics, etc where 1 row === 1 resource
  if (typeof item.url === 'string' && item.url) return item.url;
  if (typeof item.scriptUrl === 'string' && item.scriptUrl) return item.scriptUrl;
  if (typeof item.frameUrl === 'string' && item.frameUrl) return item.frameUrl;
  if (typeof item.origin === 'string' && item.origin) return item.origin;
  // For third-party-summary / third-parties-insight / third-party-facades (must be after url/origin
  // since resource-level audits like network-requests also include an entity property)
  if (typeof item.entity === 'string') return item.entity;
  if (item.entity && typeof item.entity.text === 'string') return item.entity.text;
  if (typeof item.product === 'string' && item.product) return item.product;
  // For diagnostic subitems (non-composited-animations, image-delivery-insight, valid-source-maps, layout-shifts)
  if (typeof item.failureReason === 'string') {
    return typeof item.animation === 'string'
      ? `${item.animation}:${item.failureReason}`
      : item.failureReason;
  }
  if (typeof item.reason === 'string') return item.reason;
  if (typeof item.cause === 'string') return item.cause;
  if (typeof item.error === 'string') return item.error;

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
 * Extracts normalized subitems from a detail item (`item.subItems.items` or `item.subItems`).
 *
 * @param {Record<string, any> | undefined} item
 * @return {Array<any>}
 */
function getSubItems(item) {
  if (!item || !item.subItems) return [];
  /** @type {Array<any>} */
  const raw = Array.isArray(item.subItems)
    ? item.subItems
    : Array.isArray(item.subItems.items)
    ? item.subItems.items
    : [];
  return raw.filter(entry => entry !== null && entry !== undefined);
}

/**
 * Merges two heading arrays while preserving `subItemsHeading` metadata from either list.
 *
 * @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} primaryHeadings
 * @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} secondaryHeadings
 * @return {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>}
 */
function mergeHeadings(primaryHeadings, secondaryHeadings) {
  /** @type {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} */
  const headings = [];

  /** @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>[number]} heading */
  const addHeading = heading => {
    if (!heading) return;
    const subKey = heading.subItemsHeading && heading.subItemsHeading.key;
    const existingIndex = headings.findIndex(h => {
      if (heading.key !== null) return h.key === heading.key;
      const existingSubKey = h.subItemsHeading && h.subItemsHeading.key;
      return h.key === null && Boolean(subKey) && existingSubKey === subKey;
    });
    if (existingIndex !== -1) {
      if (!headings[existingIndex].subItemsHeading && heading.subItemsHeading) {
        headings[existingIndex] = {
          ...headings[existingIndex],
          subItemsHeading: heading.subItemsHeading,
        };
      }
      return;
    }
    headings.push(heading);
  };

  for (const heading of primaryHeadings || []) addHeading(heading);
  for (const heading of secondaryHeadings || []) addHeading(heading);

  return headings;
}

/**
 * Maps table headings to their corresponding subitem headings (`heading.subItemsHeading`).
 * When no heading defines `subItemsHeading` (e.g. `deprecations`), the first column is mapped
 * to a synthetic `__self` key so 1D subitem values (links, text) can be rendered in column 0.
 *
 * @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} headings
 * @return {Array<{key: string | null, valueType: LH.DetailsType, isSelfValue?: boolean}>}
 */
function getSubItemHeadings(headings) {
  const hasExplicitSubItemsHeading = headings.some(
    heading => heading && heading.subItemsHeading && heading.subItemsHeading.key
  );

  return headings.map((heading, index) => {
    const parentType = heading.valueType || heading.itemType || 'unknown';
    if (!hasExplicitSubItemsHeading) {
      if (index === 0) {
        return {key: '__self', valueType: 'text', isSelfValue: true};
      }
      return {key: null, valueType: 'unknown'};
    }

    const subHeading = heading.subItemsHeading;
    if (!subHeading || !subHeading.key) {
      return {key: null, valueType: parentType};
    }

    return {
      key: subHeading.key,
      valueType: subHeading.valueType || subHeading.itemType || parentType,
    };
  });
}

/**
 * Zips, diffs, and sorts subitems for a matched or unmatched parent row.
 *
 * @param {string} auditId
 * @param {Record<string, any> | undefined} baseItem
 * @param {Record<string, any> | undefined} compareItem
 * @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} headings
 * @param {{hasBaseAudit?: boolean, percentAbsoluteDeltaThreshold?: number}} [options]
 * @return {{subHeadings: Array<{key: string | null, valueType: LH.DetailsType, isSelfValue?: boolean}>, sortedSubItems: Array<{base?: DetailItemEntry, compare?: DetailItemEntry, diffs: Array<LHCI.AuditDiff>, state: RowLabel}>}}
 */
function diffAndSortSubItems(auditId, baseItem, compareItem, headings, options = {}) {
  const {hasBaseAudit = true, percentAbsoluteDeltaThreshold = 0} = options;
  const subHeadings = getSubItemHeadings(headings);
  const rawBaseSubItems = getSubItems(baseItem);
  const rawCompareSubItems = getSubItems(compareItem);

  if (!rawBaseSubItems.length && !rawCompareSubItems.length) {
    return {subHeadings, sortedSubItems: []};
  }

  /**
   * @param {any} subItem
   * @return {Record<string, any>}
   */
  const normalizeSubItem = subItem => {
    if (typeof subItem !== 'object' || subItem === null) {
      return {value: String(subItem), __self: subItem};
    }
    if (subHeadings[0] && subHeadings[0].isSelfValue) {
      return {...subItem, __self: subItem};
    }
    return subItem;
  };

  // Case 1: Parent row is unmatched (added or removed, or viewed in single-report mode with no baseAudit).
  // Construct single-sided entries directly rather than zipping against themselves so duplicate keys
  // (e.g., query-string-stripped font URLs) never split into phantom rows or duplicate Preact keys.
  if (!baseItem || !compareItem) {
    const isAddedParent = Boolean(compareItem);
    const parentSubItems = (isAddedParent ? rawCompareSubItems : rawBaseSubItems).map(
      normalizeSubItem
    );
    const singleSideEntries = parentSubItems.map((item, i) =>
      isAddedParent
        ? {compare: {item, kind: 'compare', index: i}}
        : {base: {item, kind: 'base', index: i}}
    );

    /** @type {Array<LHCI.AuditDiff>} */
    const synthesizedParentDiffs = [];
    if (hasBaseAudit) {
      for (let i = 0; i < parentSubItems.length; i++) {
        const subItem = parentSubItems[i];
        for (const subHeading of subHeadings) {
          if (!subHeading.key) continue;
          const val = subItem[subHeading.key];
          if (typeof val !== 'number' || val === 0) continue;
          synthesizedParentDiffs.push(
            createAuditDiff({
              auditId,
              type: 'itemDelta',
              itemKey: subHeading.key,
              ...(isAddedParent ? {compareItemIndex: i} : {baseItemIndex: i}),
              baseValue: isAddedParent ? 0 : val,
              compareValue: isAddedParent ? val : 0,
            })
          );
        }
      }
    }

    const sortedSingle = sortZippedBaseAndCompareItems(
      synthesizedParentDiffs,
      singleSideEntries
    ).map(entry => ({
      ...entry,
      state: /** @type {RowLabel} */ ('no change'),
    }));

    return {subHeadings, sortedSubItems: sortedSingle};
  }

  // Case 2: Both baseItem and compareItem exist — pair, diff, and sort their subitems.
  const baseSubItems = rawBaseSubItems.map(normalizeSubItem);
  const compareSubItems = rawCompareSubItems.map(normalizeSubItem);

  const rawDiffs = findAuditDetailItemsDiffs(auditId, baseSubItems, compareSubItems, subHeadings);
  // Filter out itemDelta diffs below threshold so unchanged/noisy numeric subitems have `no change` row state.
  const nonZeroDiffs = rawDiffs.filter(diff => {
    if (diff.type === 'itemDelta') {
      const stats = getDeltaStats(diff);
      return stats.absoluteDelta > 0 && stats.percentAbsoluteDelta > percentAbsoluteDeltaThreshold;
    }
    return true;
  });
  const allSubDiffs = [
    ...nonZeroDiffs,
    ...synthesizeItemKeyDiffs(nonZeroDiffs, baseSubItems, compareSubItems),
  ];

  const zippedSubItems = zipBaseAndCompareItems(baseSubItems, compareSubItems);
  const sorted = sortZippedBaseAndCompareItems(allSubDiffs, zippedSubItems).map(entry => ({
    ...entry,
    state: getRowLabelForIndex(
      allSubDiffs,
      entry.compare && entry.compare.index,
      entry.base && entry.base.index
    ),
  }));

  return {subHeadings, sortedSubItems: sorted};
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
 * Normalizes `audit.details` (`table`, `opportunity`, `checklist`, or `list`) into a
 * flat `{headings, items}` table structure so both `findAuditDiffs` and the server UI's
 * `TableDetails` component can diff and render them uniformly.
 *
 * @param {LH.AuditResult} audit
 * @return {Required<Pick<Required<LH.AuditResult>['details'],'items'|'headings'>>}
 */
function normalizeDetails(audit) {
  if (!audit || !audit.details) return {items: [], headings: []};

  // Lighthouse `checklist` details (e.g. `document-latency-insight`) store `items` as a
  // `Record<string, {label: string, value: boolean}>` map rather than an array of rows.
  if (audit.details.type === 'checklist') {
    const rawItems = /** @type {Record<string, any> | Array<Record<string, any>>} */ (
      audit.details.items || {}
    );
    const entries = Array.isArray(rawItems)
      ? rawItems.map((item, idx) => [String(idx), item])
      : Object.entries(rawItems);
    return {
      headings: [
        {key: 'check', valueType: 'text', label: 'Checklist'},
        {key: 'value', valueType: 'text', label: ''},
      ],
      items: entries
        .filter(([, item]) => item && typeof item === 'object')
        .map(([key, item]) => ({
          // `getItemKey` keys items by `name`. Keying by `<checkId>:<boolean>` serves two purposes:
          // 1. Checks with the same pass/fail state match across runs even when `label` includes
          //    run-specific metrics (e.g. "Initial server response arrives quickly (observed 454 ms)").
          // 2. Checks that flip between Pass and Fail get distinct keys so `findAuditDetailItemsDiffs`
          //    (which only diffs numeric properties on matched rows) surfaces the change as an
          //    itemRemoval + itemAddition.
          name: `${item.id || key}:${Boolean(item.value)}`,
          check: item.label || '',
          value: item.value ? 'Pass' : 'Fail',
        })),
    };
  }

  // Lighthouse `list` details (used by insight audits like `lcp-phases-insight`,
  // `lcp-discovery-insight`, `cls-culprits-insight`, and `largest-contentful-paint-element`)
  // contain heterogeneous sub-sections (`table`, `checklist`, `node`), optionally wrapped in
  // `{type: 'list-section', value: ...}`. Flatten them into a single combined table.
  if (audit.details.type === 'list') {
    const rawListItems = Array.isArray(audit.details.items) ? audit.details.items : [];
    /** @type {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>} */
    const headings = [];
    /** @type {Array<Record<string, any>>} */
    const items = [];

    /** @param {NonNullable<NonNullable<LH.AuditResult['details']>['headings']>[number]} heading */
    const addHeading = heading => {
      if (!heading) return;
      if (heading.key !== null) {
        const existingIndex = headings.findIndex(h => h.key === heading.key);
        if (existingIndex !== -1) {
          if (!headings[existingIndex].subItemsHeading && heading.subItemsHeading) {
            headings[existingIndex] = {
              ...headings[existingIndex],
              subItemsHeading: heading.subItemsHeading,
            };
          }
          return;
        }
      }
      headings.push(heading);
    };

    for (const entry of rawListItems) {
      const subDetail = entry && entry.type === 'list-section' ? entry.value : entry;
      if (!subDetail || typeof subDetail !== 'object') continue;

      if (subDetail.type === 'table' || subDetail.type === 'opportunity') {
        for (const heading of subDetail.headings || []) {
          addHeading(heading);
        }
        for (const item of Array.isArray(subDetail.items) ? subDetail.items : []) {
          const normalizedItem = {...item};
          // `getItemKey` looks for a known identifier field (`url`, `node.path`, `label`, `name`,
          // etc.) before falling back to `JSON.stringify(item)`. Sub-tables in `list` audits often
          // identify rows by `phase` (`largest-contentful-paint-element`), `subpart`
          // (`lcp-phases-insight`), or a text-typed `node` (`cls-culprits-insight`'s "Total" row).
          // Populate `label` so `zipBaseAndCompareItems` pairs corresponding rows across runs
          // instead of treating timing/score changes as removed + added rows.
          if (typeof normalizedItem.label !== 'string') {
            if (typeof normalizedItem.phase === 'string') {
              normalizedItem.label = normalizedItem.phase;
            } else if (typeof normalizedItem.subpart === 'string') {
              normalizedItem.label = normalizedItem.subpart;
            } else if (
              normalizedItem.node &&
              normalizedItem.node.type === 'text' &&
              typeof normalizedItem.node.value === 'string'
            ) {
              normalizedItem.label = normalizedItem.node.value;
            }
          }
          items.push(normalizedItem);
        }
      } else if (subDetail.type === 'checklist') {
        const normalizedChecklist = normalizeDetails({score: null, details: subDetail});
        for (const heading of normalizedChecklist.headings) {
          addHeading(heading);
        }
        items.push(...normalizedChecklist.items);
      } else if (subDetail.type === 'node') {
        addHeading({key: 'node', valueType: 'node', label: 'Element'});
        items.push({node: subDetail});
      }
    }

    return {items, headings};
  }

  return {
    items: Array.isArray(audit.details.items) ? audit.details.items : [],
    headings: audit.details.headings || [],
  };
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
  if (
    (baseAuditDetails.type !== 'debugdata' && baseAuditDetails.items) ||
    (compareAuditDetails.type !== 'debugdata' && compareAuditDetails.items)
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
  normalizeDetails,
  mergeHeadings,
  getSubItems,
  getSubItemHeadings,
  diffAndSortSubItems,
  getDiffSeverity,
  getDeltaLabel,
  getDeltaStats,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
  getMostSevereDiffLabel,
  getMetricScoreLevel,
  getItemKey,
  zipBaseAndCompareItems,
  synthesizeItemKeyDiffs,
  sortZippedBaseAndCompareItems,
  replaceNondeterministicStrings,
};
