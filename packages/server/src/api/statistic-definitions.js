/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs');

/** @typedef {(lhrs: Array<LH.Result>) => ({value: number})} StatisticFn */

/**
 * @return {StatisticFn}
 */
function metaLighthouseVersion() {
  return lhrs => {
    const version = lhrs[0].lighthouseVersion || '';
    const [_, major = '0', minor = '0', patch = '0'] = version.match(/^(\d+)\.(\d+)\.(\d+)/) || [];
    const versionAsNumber = Number(major) * 100 * 100 + Number(minor) * 100 + Number(patch);
    return {value: versionAsNumber || 0};
  };
}

/** @param {Array<number>} values */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const medianIndex = Math.floor(values.length / 2);

  if (values.length === 0) return {value: -1};
  return {value: sorted[medianIndex]};
}

/**
 * @param {string} auditId
 * @return {StatisticFn}
 */
function auditNumericValueMedian(auditId) {
  return lhrs => {
    const values = lhrs
      .map(lhr => lhr.audits[auditId] && lhr.audits[auditId].numericValue)
      .filter(
        /** @return {value is number} */ value =>
          typeof value === 'number' && Number.isFinite(value)
      );

    return median(values);
  };
}

/**
 * @param {string} categoryId
 * @return {StatisticFn}
 */
function categoryScoreMedian(categoryId) {
  return lhrs => {
    const values = lhrs
      .map(lhr => lhr.categories[categoryId] && lhr.categories[categoryId].score)
      .filter(
        /** @return {value is number} */ value =>
          typeof value === 'number' && Number.isFinite(value)
      );

    return median(values);
  };
}

/**
 * @param {string} categoryId
 * @param {'min'|'max'} type
 * @return {StatisticFn}
 */
function categoryScoreMinOrMax(categoryId, type) {
  return lhrs => {
    const values = lhrs
      .map(lhr => lhr.categories[categoryId] && lhr.categories[categoryId].score)
      .filter(
        /** @return {value is number} */ value =>
          typeof value === 'number' && Number.isFinite(value)
      );

    if (!values.length) return {value: -1};
    return {value: Math[type](...values)};
  };
}

/**
 * @param {string} groupId
 * @param {'pass'|'fail'|'na'} type
 * @return {StatisticFn}
 */
function auditGroupCountOfMedianLhr(groupId, type) {
  return lhrs => {
    const [medianLhr] = computeRepresentativeRuns([lhrs.map(lhr => [lhr, lhr])]);
    if (!medianLhr) return {value: -1};

    // Start out with -1 as "no data available"
    let count = -1;
    for (const category of Object.values(medianLhr.categories)) {
      for (const auditRef of category.auditRefs || []) {
        if (auditRef.group !== groupId) continue;
        const audit = medianLhr.audits[auditRef.id];
        if (!audit) continue;

        // Once we find our first candidate audit, set the count to 0.
        if (count === -1) count = 0;

        const {score, scoreDisplayMode} = audit;
        if (scoreDisplayMode === 'informative' && type === 'na') count++;
        if (scoreDisplayMode === 'notApplicable' && type === 'na') count++;
        if (scoreDisplayMode === 'binary' && score === 1 && type === 'pass') count++;
        if (scoreDisplayMode === 'binary' && score !== 1 && type === 'fail') count++;
        if (scoreDisplayMode === 'error' && type === 'fail') count++;
      }
    }

    return {value: count};
  };
}

/** @type {Record<LHCI.ServerCommand.StatisticName, StatisticFn>} */
const definitions = {
  meta_lighthouse_version: metaLighthouseVersion(),
  audit_interactive_median: auditNumericValueMedian('interactive'),
  'audit_speed-index_median': auditNumericValueMedian('speed-index'),
  'audit_first-contentful-paint_median': auditNumericValueMedian('first-contentful-paint'),
  'audit_largest-contentful-paint_median': auditNumericValueMedian('largest-contentful-paint'),
  'audit_total-blocking-time_median': auditNumericValueMedian('total-blocking-time'),
  'audit_max-potential-fid_median': auditNumericValueMedian('max-potential-fid'),
  category_performance_median: categoryScoreMedian('performance'),
  category_pwa_median: categoryScoreMedian('pwa'),
  category_seo_median: categoryScoreMedian('seo'),
  category_accessibility_median: categoryScoreMedian('accessibility'),
  'category_best-practices_median': categoryScoreMedian('best-practices'),
  category_performance_min: categoryScoreMinOrMax('performance', 'min'),
  category_pwa_min: categoryScoreMinOrMax('pwa', 'min'),
  category_seo_min: categoryScoreMinOrMax('seo', 'min'),
  category_accessibility_min: categoryScoreMinOrMax('accessibility', 'min'),
  'category_best-practices_min': categoryScoreMinOrMax('best-practices', 'min'),
  category_performance_max: categoryScoreMinOrMax('performance', 'max'),
  category_pwa_max: categoryScoreMinOrMax('pwa', 'max'),
  category_seo_max: categoryScoreMinOrMax('seo', 'max'),
  category_accessibility_max: categoryScoreMinOrMax('accessibility', 'max'),
  'category_best-practices_max': categoryScoreMinOrMax('best-practices', 'max'),
  'auditgroup_pwa-fast-reliable_pass': auditGroupCountOfMedianLhr('pwa-fast-reliable', 'pass'),
  'auditgroup_pwa-fast-reliable_fail': auditGroupCountOfMedianLhr('pwa-fast-reliable', 'fail'),
  'auditgroup_pwa-fast-reliable_na': auditGroupCountOfMedianLhr('pwa-fast-reliable', 'na'),
  'auditgroup_pwa-installable_pass': auditGroupCountOfMedianLhr('pwa-installable', 'pass'),
  'auditgroup_pwa-installable_fail': auditGroupCountOfMedianLhr('pwa-installable', 'fail'),
  'auditgroup_pwa-installable_na': auditGroupCountOfMedianLhr('pwa-installable', 'na'),
  'auditgroup_pwa-optimized_pass': auditGroupCountOfMedianLhr('pwa-optimized', 'pass'),
  'auditgroup_pwa-optimized_fail': auditGroupCountOfMedianLhr('pwa-optimized', 'fail'),
  'auditgroup_pwa-optimized_na': auditGroupCountOfMedianLhr('pwa-optimized', 'na'),
  'auditgroup_a11y-best-practices_pass': auditGroupCountOfMedianLhr('a11y-best-practices', 'pass'),
  'auditgroup_a11y-best-practices_fail': auditGroupCountOfMedianLhr('a11y-best-practices', 'fail'),
  'auditgroup_a11y-best-practices_na': auditGroupCountOfMedianLhr('a11y-best-practices', 'na'),
  'auditgroup_a11y-color-contrast_pass': auditGroupCountOfMedianLhr('a11y-color-contrast', 'pass'),
  'auditgroup_a11y-color-contrast_fail': auditGroupCountOfMedianLhr('a11y-color-contrast', 'fail'),
  'auditgroup_a11y-color-contrast_na': auditGroupCountOfMedianLhr('a11y-color-contrast', 'na'),
  'auditgroup_a11y-names-labels_pass': auditGroupCountOfMedianLhr('a11y-names-labels', 'pass'),
  'auditgroup_a11y-names-labels_fail': auditGroupCountOfMedianLhr('a11y-names-labels', 'fail'),
  'auditgroup_a11y-names-labels_na': auditGroupCountOfMedianLhr('a11y-names-labels', 'na'),
  'auditgroup_a11y-navigation_pass': auditGroupCountOfMedianLhr('a11y-navigation', 'pass'),
  'auditgroup_a11y-navigation_fail': auditGroupCountOfMedianLhr('a11y-navigation', 'fail'),
  'auditgroup_a11y-navigation_na': auditGroupCountOfMedianLhr('a11y-navigation', 'na'),
  'auditgroup_a11y-aria_pass': auditGroupCountOfMedianLhr('a11y-aria', 'pass'),
  'auditgroup_a11y-aria_fail': auditGroupCountOfMedianLhr('a11y-aria', 'fail'),
  'auditgroup_a11y-aria_na': auditGroupCountOfMedianLhr('a11y-aria', 'na'),
  'auditgroup_a11y-language_pass': auditGroupCountOfMedianLhr('a11y-language', 'pass'),
  'auditgroup_a11y-language_fail': auditGroupCountOfMedianLhr('a11y-language', 'fail'),
  'auditgroup_a11y-language_na': auditGroupCountOfMedianLhr('a11y-language', 'na'),
  'auditgroup_a11y-audio-video_pass': auditGroupCountOfMedianLhr('a11y-audio-video', 'pass'),
  'auditgroup_a11y-audio-video_fail': auditGroupCountOfMedianLhr('a11y-audio-video', 'fail'),
  'auditgroup_a11y-audio-video_na': auditGroupCountOfMedianLhr('a11y-audio-video', 'na'),
  'auditgroup_a11y-tables-lists_pass': auditGroupCountOfMedianLhr('a11y-tables-lists', 'pass'),
  'auditgroup_a11y-tables-lists_fail': auditGroupCountOfMedianLhr('a11y-tables-lists', 'fail'),
  'auditgroup_a11y-tables-lists_na': auditGroupCountOfMedianLhr('a11y-tables-lists', 'na'),
  'auditgroup_seo-mobile_pass': auditGroupCountOfMedianLhr('seo-mobile', 'pass'),
  'auditgroup_seo-mobile_fail': auditGroupCountOfMedianLhr('seo-mobile', 'fail'),
  'auditgroup_seo-mobile_na': auditGroupCountOfMedianLhr('seo-mobile', 'na'),
  'auditgroup_seo-content_pass': auditGroupCountOfMedianLhr('seo-content', 'pass'),
  'auditgroup_seo-content_fail': auditGroupCountOfMedianLhr('seo-content', 'fail'),
  'auditgroup_seo-content_na': auditGroupCountOfMedianLhr('seo-content', 'na'),
  'auditgroup_seo-crawl_pass': auditGroupCountOfMedianLhr('seo-crawl', 'pass'),
  'auditgroup_seo-crawl_fail': auditGroupCountOfMedianLhr('seo-crawl', 'fail'),
  'auditgroup_seo-crawl_na': auditGroupCountOfMedianLhr('seo-crawl', 'na'),
};

// Keep the export separate from declaration to enable tsc to typecheck the `@type` annotation.
module.exports = {definitions, VERSION: 2};
