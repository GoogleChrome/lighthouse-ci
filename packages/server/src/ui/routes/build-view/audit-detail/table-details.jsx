/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import clsx from 'clsx';
import './table-details.css';

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
  const {audit, diffs} = props.pair;
  if (!audit.details) return <Fragment />;
  const {headings, items: compareItems} = audit.details;
  if (!headings || !compareItems) return <Fragment />;

  const items = compareItems;

  return (
    <div className="table-details">
      <table>
        <thead>
          <tr>
            {headings.map((heading, i) => {
              return <th key={i}>{heading.label}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const state = determineRowState(diffs, i, undefined);

            return (
              <tr key={i}>
                <td>{state}</td>
                {headings.map((heading, j) => {
                  return <td key={j}>{item[heading.key]}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
