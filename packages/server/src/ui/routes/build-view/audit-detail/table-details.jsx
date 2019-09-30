/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './table-details.css';
import {SimpleDetails} from './simple-details';
import {zipBaseAndCompareItems} from '@lhci/utils/src/audit-diff-finder';

/** @typedef {'better'|'worse'|'added'|'removed'|'none'} RowState */

/** @type {Array<RowState>} */
const ROW_STATE_SORT_ORDER = ['added', 'worse', 'removed', 'better', 'none'];

/**
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {RowState}
 */
function determineRowState(diffs, compareItemIndex, baseItemIndex) {
  if (
    diffs.some(diff => diff.type === 'itemAddition' && diff.compareItemIndex === compareItemIndex)
  )
    return 'added';
  if (diffs.some(diff => diff.type === 'itemRemoval' && diff.baseItemIndex === baseItemIndex))
    return 'removed';

  const matchingDiffs = diffs.filter(
    diff => diff.type === 'itemDelta' && diff.compareItemIndex === compareItemIndex
  );
  if (matchingDiffs.some(diff => diff.type === 'itemDelta' && diff.compareValue > diff.baseValue))
    return 'worse';

  if (matchingDiffs.some(diff => diff.type === 'itemDelta' && diff.compareValue < diff.baseValue))
    return 'better';

  return 'none';
}

/** @param {{pair: LHCI.AuditPair}} props */
export const TableDetails = props => {
  const {audit, baseAudit, diffs} = props.pair;
  if (!audit.details) return <Fragment />;
  const {headings, items: compareItems} = audit.details;
  if (!headings || !compareItems) return <Fragment />;

  const baseItems = (baseAudit && baseAudit.details && baseAudit.details.items) || [];

  const zippedItems = zipBaseAndCompareItems(baseItems, compareItems).sort(
    (a, b) =>
      ROW_STATE_SORT_ORDER.indexOf(
        determineRowState(diffs, a.compare && a.compare.index, a.base && a.base.index)
      ) -
      ROW_STATE_SORT_ORDER.indexOf(
        determineRowState(diffs, b.compare && b.compare.index, b.base && b.base.index)
      )
  );

  return (
    <div className="table-details">
      <table>
        <thead>
          <tr>
            <th />
            {headings.map((heading, i) => {
              return (
                <th className={`table-column--${heading.valueType}`} key={i}>
                  {heading.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {zippedItems.map(({base, compare}) => {
            const definedItem = compare || base;
            // This should never be true, but make tsc happy
            if (!definedItem) return null;

            const item = definedItem.item;
            const key = `${base && base.index}-${compare && compare.index}`;
            const state = determineRowState(diffs, compare && compare.index, base && base.index);

            return (
              <tr key={key}>
                <td>{state}</td>
                {headings.map((heading, j) => {
                  return (
                    <td key={j} className={`table-column--${heading.valueType}`}>
                      <SimpleDetails type={heading.valueType} value={item[heading.key]} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
