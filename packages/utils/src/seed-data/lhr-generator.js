/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('../lodash.js');

/** @typedef {import('./prandom.js')} PRandom */

const LOREM_IPSUM =
  // eslint-disable-next-line max-len
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin urna nunc, molestie sed hendrerit et, vulputate vitae mauris. Sed tempor vitae risus vel hendrerit. Nulla vestibulum malesuada erat vitae laoreet. Phasellus sodales vehicula dolor, dictum ullamcorper metus aliquam id. Nullam porttitor posuere purus id rhoncus. Sed et mi ligula. Donec imperdiet nulla sit amet justo cursus, id tempus ex accumsan. Maecenas ultricies elit eget lectus posuere vestibulum. Cras vestibulum neque nec justo congue feugiat non id dui. Pellentesque dapibus ac orci sed malesuada. Sed rhoncus vitae lorem eget facilisis. Donec auctor tortor a tortor egestas, vel condimentum lacus auctor.';

/** @typedef {{url?: string, inclusionRate?: number, averageWastedMs?: number, averageTotalBytes?: number, averageWastedBytes?: number}} ItemGenDef */
/** @typedef {{auditId: string, passRate?: number, averageNumericValue?: number, averageWastedMs?: number, items?: ItemGenDef[], unit?: string}} AuditGenDef */

/** @param {string} auditId */
function getCategoryForAuditId(auditId) {
  if (auditId.startsWith('a11y')) return 'accessibility';
  if (auditId.startsWith('seo')) return 'seo';
  if (auditId.startsWith('best-practices')) return 'best-practices';
  if (auditId.startsWith('pwa')) return 'pwa';
  return 'performance';
}

/** @param {string} auditId */
function getGroupForAuditId(auditId) {
  if (auditId === 'first-contentful-paint') return 'metrics';
  if (auditId === 'first-meaningful-paint') return 'metrics';
  if (auditId === 'speed-index') return 'metrics';
  if (auditId === 'interactive') return 'metrics';
  if (auditId === 'first-cpu-idle') return 'metrics';
  if (auditId === 'max-potential-fid') return 'metrics';
  if (auditId.startsWith('diagnostic-')) return 'diagnostics';
  if (auditId.startsWith('uses-')) return 'load-opportunities';
  if (auditId.startsWith('a11y-aria')) return 'a11y-aria';
  if (auditId.startsWith('a11y')) return 'a11y-best-practices';
  if (auditId.startsWith('seo')) return 'seo-content';
  if (auditId.startsWith('best-practices')) return 'best-practices';
  if (auditId.startsWith('pwa-fast-reliable')) return 'pwa-fast-reliable';
  if (auditId.startsWith('pwa-installable')) return 'pwa-installable';
  if (auditId.startsWith('pwa-optimized')) return 'pwa-optimized';
}

/** @param {number} average @param {PRandom} prandom */
function generateNumericValue(average, prandom) {
  const maxDeltaAsPercent = 0.1;
  const maxDelta = average * maxDeltaAsPercent;
  const percentile = prandom.next();
  return (percentile - 0.5) * 2 * maxDelta + average;
}

/**
 *
 * @param {string} pageUrl
 * @param {Array<AuditGenDef>} auditDefs
 * @param {PRandom} prandom
 * @return {LH.Result}
 */
function createLHR(pageUrl, auditDefs, prandom) {
  /** @type {LH.Result['audits']} */
  const audits = {};

  const loremIpsumTokens = LOREM_IPSUM.split(' ');
  for (const auditDef of auditDefs) {
    const {auditId, averageNumericValue, averageWastedMs, unit = 'items'} = auditDef;
    const groupId = getGroupForAuditId(auditId);
    if (typeof averageNumericValue === 'number') {
      const numericValue = generateNumericValue(averageNumericValue, prandom);
      // score of 100 = <1000
      // score of 0 = >10000
      const score = 1 - Math.min(1, Math.max((numericValue - 1000) / 9000, 0));
      audits[auditId] = {
        score,
        numericValue,
        scoreDisplayMode: 'numeric',
        displayValue:
          groupId === 'metrics'
            ? `${(numericValue / 1000).toLocaleString(undefined, {maximumFractionDigits: 1})} s`
            : `${Math.round(numericValue)} ${unit}`,
      };
    } else if (typeof averageWastedMs === 'number') {
      const wastedMs = generateNumericValue(averageWastedMs, prandom);
      // score of 100 = <100
      // score of 0 = >1000
      const score = 1 - Math.min(1, Math.max((wastedMs - 100) / 900, 0));
      const hasBytes = auditDef.items && auditDef.items.some(item => item.averageWastedBytes);
      const wastedBytes = wastedMs * 257;
      audits[auditId] = {
        score,
        scoreDisplayMode: 'numeric',
        displayValue: hasBytes
          ? `${(wastedBytes / 1024).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })} KB`
          : `${(wastedMs / 1000).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })} s`,
        details: {
          type: 'opportunity',
          overallSavingsMs: wastedMs,
          overallSavingsBytes: hasBytes ? wastedBytes : undefined,
          items: [],
        },
      };
    } else {
      const {passRate = 1} = auditDef;
      audits[auditId] = {score: prandom.next() <= passRate ? 1 : 0, scoreDisplayMode: 'binary'};
    }

    /** @type {Record<string, any>} */
    const headersAsObject = {};
    if (auditDef.items) {
      const items = [];
      for (const {url, inclusionRate = 1, ...rest} of auditDef.items) {
        if (prandom.next() > inclusionRate) continue;
        /** @type {any} */
        const item = {};
        if (url) {
          if (url.includes('lorempixel')) {
            headersAsObject.thumbnail = {key: 'url', valueType: 'thumbnail'};
          }

          headersAsObject.url = {key: 'url', valueType: 'url', label: 'URL'};
          item.url = new URL(url, pageUrl).href;
        }

        for (const key of Object.keys(rest)) {
          if (key.startsWith('average')) {
            const dataKey = key.replace('average', '').replace(/^\w/, v => v.toLowerCase());
            const valueType = key.endsWith('Ms') ? 'timespanMs' : 'bytes';
            headersAsObject[dataKey] = {key: dataKey, valueType, label: _.startCase(dataKey)};
            // @ts-ignore - tsc can't understand Object.keys
            const averageValue = rest[key];
            item[dataKey] = generateNumericValue(averageValue, prandom);
          } else {
            headersAsObject[key] = {key, valueType: 'text', label: _.startCase(key)};
            // @ts-ignore - tsc can't understand Object.keys
            item[key] = rest[key];
          }
        }

        items.push(item);
      }

      const details = audits[auditId].details || {type: 'table'};
      details.headings = Object.values(headersAsObject).map(header => {
        // Do the inverse of _getCanonicalizedTableHeadings
        if (getGroupForAuditId(auditId) === 'load-opportunities') return header;
        return {...header, itemType: header.valueType, text: header.label, valueType: undefined};
      });
      details.items = items;
      audits[auditId].details = details;
    }

    audits[auditId].title = _.startCase(auditId);
    audits[auditId].description = `Help text for ${_.startCase(auditId)}. ${loremIpsumTokens
      .slice(0, Math.round(auditId.length * 1.5))
      .join(' ')}.`;
  }

  /** @type {LH.Result['categories']} */
  const categories = {};

  const auditsGroupedByCategory = _.groupBy(Object.entries(audits), pair =>
    getCategoryForAuditId(pair[0])
  );
  for (const audits of auditsGroupedByCategory) {
    const category = getCategoryForAuditId(audits[0][0]);
    const sum = audits.reduce((sum, next) => sum + (next[1].score || 0), 0);
    categories[category] = {
      id: category,
      title: category.toUpperCase(),
      score: sum / audits.length,
      auditRefs: audits.map(([id]) => ({id, weight: 1, group: getGroupForAuditId(id)})),
    };
  }

  const fetchTimeBase = new Date('2019-08-01T12:00:00').getTime();
  const fetchTimeOffset = Math.round(prandom.next() * 1000 * 60 * 60 * 24 * 7);
  const fetchTime = new Date(fetchTimeBase + fetchTimeOffset).toISOString();

  return {
    requestedUrl: pageUrl,
    finalUrl: pageUrl,
    categories,
    audits,

    fetchTime,
    lighthouseVersion: '5.2.0',
    configSettings: {channel: 'cli'},
    categoryGroups: {
      metrics: {title: 'Metrics'},
      'load-opportunities': {title: 'Opportunities'},
      diagnostics: {title: 'Diagnostics'},
      accessibility: {title: 'Accessibility'},
      seo: {title: 'SEO'},
      'best-practices': {title: 'Best Practices'},
      'pwa-fast-reliable': {title: 'PWA Fast & Reliable'},
      'pwa-installable': {title: 'PWA Installable'},
      'pwa-optimized': {title: 'PWA Optimized'},
    },
    runWarnings: [],
    userAgent: 'Chrome!',
    environment: {hostUserAgent: '', networkUserAgent: '', benchmarkIndex: 500},
    timing: {total: 1, entries: []},
    i18n: {rendererFormattedStrings: {}, icuMessagePaths: {}},
  };
}

module.exports = {createLHR, generateNumericValue};
