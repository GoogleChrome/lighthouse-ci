/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './table-details.css';
import {SimpleDetails} from './simple-details';
import {zipBaseAndCompareItems, getRowLabelForIndex} from '@lhci/utils/src/audit-diff-finder';

/** @typedef {import('@lhci/utils/src/audit-diff-finder').RowLabel} RowLabel */

/** @type {Array<RowLabel>} */
const ROW_STATE_SORT_ORDER = ['added', 'worse', 'ambiguous', 'removed', 'better', 'no change'];

/** @param {{pair: LHCI.AuditPair}} props */
export const TableDetails = props => {
  const {audit, baseAudit, diffs} = props.pair;
  if (!audit.details) return <Fragment />;
  const {headings: compareHeadings, items: compareItems} = audit.details;
  if (!compareHeadings || !compareItems) return <Fragment />;

  const baseHeadings = (baseAudit && baseAudit.details && baseAudit.details.headings) || [];
  const baseItems = (baseAudit && baseAudit.details && baseAudit.details.items) || [];

  const zippedItems = zipBaseAndCompareItems(baseItems, compareItems).sort(
    (a, b) =>
      ROW_STATE_SORT_ORDER.indexOf(
        getRowLabelForIndex(diffs, a.compare && a.compare.index, a.base && a.base.index)
      ) -
      ROW_STATE_SORT_ORDER.indexOf(
        getRowLabelForIndex(diffs, b.compare && b.compare.index, b.base && b.base.index)
      )
  );

  const headings = compareHeadings.length ? compareHeadings : baseHeadings;

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

            const key = `${base && base.index}-${compare && compare.index}`;
            const state = getRowLabelForIndex(diffs, compare && compare.index, base && base.index);

            return (
              <tr key={key}>
                <td className="table-column--row-label">{state}</td>
                {headings.map((heading, j) => {
                  const itemType = heading.valueType || heading.itemType || 'unknown';
                  return (
                    <td key={j} className={`table-column--${itemType}`}>
                      <SimpleDetails
                        type={itemType}
                        compareValue={compare && compare.item[heading.key]}
                        baseValue={base && base.item[heading.key]}
                      />
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
