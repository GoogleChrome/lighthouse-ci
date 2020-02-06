/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './table-details.css';
import {SimpleDetails} from './simple-details';
import {
  zipBaseAndCompareItems,
  sortZippedBaseAndCompareItems,
  getRowLabelForIndex,
} from '@lhci/utils/src/audit-diff-finder';

/** @param {LH.DetailsType} itemType @return {boolean} */
function isNumericValueType(itemType) {
  switch (itemType) {
    case 'bytes':
    case 'ms':
    case 'timespanMs':
    case 'numeric':
      return true;
    default:
      return false;
  }
}

/** @param {{pair: LHCI.AuditPair}} props */
export const TableDetails = props => {
  const {audit, baseAudit, diffs: allDiffs} = props.pair;
  if (!audit.details) return <Fragment />;
  const {headings: compareHeadings, items: compareItems} = audit.details;
  if (!compareHeadings || !compareItems) return <Fragment />;

  const baseHeadings = (baseAudit && baseAudit.details && baseAudit.details.headings) || [];
  const baseItems = (baseAudit && baseAudit.details && baseAudit.details.items) || [];

  const zippedItems = zipBaseAndCompareItems(baseItems, compareItems);
  const sortedItems = sortZippedBaseAndCompareItems(allDiffs, zippedItems);
  const headings = compareHeadings.length ? compareHeadings : baseHeadings;
  // We'll insert the row label before the first numeric heading, or last if none is found.
  let insertRowLabelAfterIndex =
    headings.findIndex(heading =>
      isNumericValueType(heading.valueType || heading.itemType || 'unknown')
    ) - 1;
  if (insertRowLabelAfterIndex < 0) insertRowLabelAfterIndex = headings.length - 1;

  return (
    <div className="table-details">
      <table>
        <thead>
          <tr>
            {headings.map((heading, i) => {
              const itemType = heading.valueType || heading.itemType || 'unknown';
              return (
                <Fragment key={i}>
                  <th className={`table-column--${itemType}`}>{heading.label || heading.text}</th>
                  {insertRowLabelAfterIndex === i ? <th /> : null}
                </Fragment>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedItems.map(({base, compare, diffs}) => {
            const definedItem = compare || base;
            // This should never be true, but make tsc happy
            if (!definedItem) return null;

            const key = `${base && base.index}-${compare && compare.index}`;
            const state = getRowLabelForIndex(
              allDiffs,
              compare && compare.index,
              base && base.index
            );

            return (
              <tr key={key}>
                {headings.map((heading, j) => {
                  const itemType = heading.valueType || heading.itemType || 'unknown';
                  const diff = diffs.find(
                    /** @return {diff is LHCI.NumericItemAuditDiff} */
                    diff => diff.type === 'itemDelta' && diff.itemKey === heading.key
                  );

                  return (
                    <Fragment key={j}>
                      <td className={`table-column--${itemType}`}>
                        <SimpleDetails
                          type={itemType}
                          compareValue={compare && compare.item[heading.key]}
                          baseValue={base && base.item[heading.key]}
                          diff={diff}
                        />
                      </td>
                      {insertRowLabelAfterIndex === j ? (
                        <td className="table-column--row-label">
                          {state === 'added' || state === 'removed' ? state : ''}
                        </td>
                      ) : null}
                    </Fragment>
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
