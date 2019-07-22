/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/** @typedef {(lhrs: Array<LH.Result>) => ({value: number})} StatisticFn */

/**
 *
 * @param {string} auditId
 * @return {StatisticFn}
 */
function auditNumericValueAverage(auditId) {
  return lhrs => {
    const values = lhrs
      .map(lhr => lhr.audits[auditId] && lhr.audits[auditId].numericValue)
      .filter(
        /** @return {value is number} */ value =>
          typeof value === 'number' && Number.isFinite(value)
      );

    const sum = values.reduce((x, y) => x + y, 0);
    const count = values.length;

    if (count === 0) return {value: 0};
    return {value: sum / count};
  };
}

/** @type {Record<LHCI.ServerCommand.StatisticName, StatisticFn>} */
module.exports = {
  audit_interactive_average: auditNumericValueAverage('interactive'),
  'audit_speed-index_average': auditNumericValueAverage('speed-index'),
  'audit_first-contentful-paint_average': auditNumericValueAverage('first-contentful-paint'),
};
