/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/** @param {LH.Result} lhr @param {string} auditName */
const getAuditValue = (lhr, auditName) =>
  (lhr.audits[auditName] && lhr.audits[auditName].numericValue) || 0;

/**
 * @param {LH.Result} lhr
 * @param {number} medianFcp
 * @param {number} medianInteractive
 */
function getMedianSortValue(lhr, medianFcp, medianInteractive) {
  const distanceFcp = medianFcp - getAuditValue(lhr, 'first-contentful-paint');
  const distanceInteractive = medianInteractive - getAuditValue(lhr, 'interactive');

  return distanceFcp * distanceFcp + distanceInteractive * distanceInteractive;
}

/**
 * @template T
 * @param {Array<Array<[T, LH.Result]>>} runsByUrl
 * @return {Array<T>}
 */
function computeRepresentativeRuns(runsByUrl) {
  /** @type {Array<T>} */
  const representativeRuns = [];

  for (const runs of runsByUrl) {
    if (!runs.length) continue;

    const sortedByFcp = runs
      .slice()
      .sort(
        (a, b) =>
          getAuditValue(a[1], 'first-contentful-paint') -
          getAuditValue(b[1], 'first-contentful-paint')
      );
    const medianFcp = getAuditValue(
      sortedByFcp[Math.floor(runs.length / 2)][1],
      'first-contentful-paint'
    );

    const sortedByInteractive = runs
      .slice()
      .sort((a, b) => getAuditValue(a[1], 'interactive') - getAuditValue(b[1], 'interactive'));
    const medianInteractive = getAuditValue(
      sortedByInteractive[Math.floor(runs.length / 2)][1],
      'interactive'
    );

    const sortedByProximityToMedian = runs
      .slice()
      .sort(
        (a, b) =>
          getMedianSortValue(a[1], medianFcp, medianInteractive) -
          getMedianSortValue(b[1], medianFcp, medianInteractive)
      );

    representativeRuns.push(sortedByProximityToMedian[0][0]);
  }

  return representativeRuns;
}

module.exports = {computeRepresentativeRuns};
