/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState} from 'preact/hooks';
import clsx from 'clsx';
import './table-details.css';
import {SimpleDetails} from './simple-details';
import {
  getItemKey,
  zipBaseAndCompareItems,
  sortZippedBaseAndCompareItems,
  getRowLabelForIndex,
  normalizeDetails,
  mergeHeadings,
  diffAndSortSubItems,
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
  const [expandedRows, setExpandedRows] = useState(
    /** @type {Record<string, boolean | undefined>} */ ({})
  );
  const [showUnchangedSubRows, setShowUnchangedSubRows] = useState(
    /** @type {Record<string, boolean | undefined>} */ ({})
  );

  if (!audit.details) return <Fragment />;
  const {headings: compareHeadings, items: compareItems} = normalizeDetails(audit);
  const {headings: baseHeadings, items: baseItems} = baseAudit
    ? normalizeDetails(baseAudit)
    : {headings: [], items: []};
  if (!compareHeadings.length && !baseHeadings.length) return <Fragment />;

  const zippedItems = zipBaseAndCompareItems(baseItems, compareItems);
  const sortedItems = sortZippedBaseAndCompareItems(allDiffs, zippedItems);
  const headings = mergeHeadings(compareHeadings, baseHeadings);
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
        {sortedItems.map(({base, compare, diffs}) => {
          const definedItem = compare || base;
          // This should never be true, but make tsc happy
          if (!definedItem) return null;

          const key = `${getItemKey(definedItem.item)}-${base && base.index}-${
            compare && compare.index
          }`;
          const state = getRowLabelForIndex(
            allDiffs,
            compare && compare.index,
            base && base.index
          );

          const {subHeadings, sortedSubItems} = diffAndSortSubItems(
            audit.id || '',
            base && base.item,
            compare && compare.item,
            headings,
            {
              hasBaseAudit: Boolean(baseAudit),
              percentAbsoluteDeltaThreshold: props.pair.percentAbsoluteDeltaThreshold,
            }
          );
          const hasSubItems = sortedSubItems.length > 0;
          const changedSubItems = sortedSubItems.filter(sub => sub.state !== 'no change');
          const defaultExpanded = state !== 'no change' || changedSubItems.length > 0;
          const isExpanded =
            expandedRows[key] !== undefined ? Boolean(expandedRows[key]) : defaultExpanded;

          let visibleSubItems = sortedSubItems;
          let hiddenUnchangedCount = 0;
          if (
            !showUnchangedSubRows[key] &&
            changedSubItems.length > 0 &&
            changedSubItems.length < sortedSubItems.length
          ) {
            visibleSubItems = changedSubItems;
            hiddenUnchangedCount = sortedSubItems.length - changedSubItems.length;
          }

          return (
            <tbody key={key} className="table-details__row-group">
              <tr
                className={clsx({
                  'table-details__parent-row--expandable': hasSubItems,
                })}
                onClick={evt => {
                  if (!hasSubItems) return;
                  const target = evt.target;
                  if (
                    target instanceof Element &&
                    target.closest('a, button:not(.table-details__chevron)')
                  ) {
                    return;
                  }
                  setExpandedRows(prev => ({...prev, [key]: !isExpanded}));
                }}
              >
                {headings.map((heading, j) => {
                  const itemType = heading.valueType || heading.itemType || 'unknown';
                  const diff = diffs.find(
                    /** @return {diff is LHCI.NumericItemAuditDiff} */
                    diff => diff.type === 'itemDelta' && diff.itemKey === heading.key
                  );

                  // With the introduction of subitems, not every item will have a value for every heading.
                  const compareItem =
                    heading.key && compare ? compare.item[heading.key] : undefined;
                  const baseItem = heading.key && base ? base.item[heading.key] : undefined;

                  return (
                    <Fragment key={j}>
                      <td className={`table-column--${itemType}`}>
                        {j === 0 && hasSubItems ? (
                          <button
                            type="button"
                            className="table-details__chevron"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse subitems' : 'Expand subitems'}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                        ) : null}
                        {compareItem != null || baseItem != null ? (
                          <SimpleDetails
                            type={itemType}
                            compareValue={compareItem}
                            baseValue={baseItem}
                            diff={diff}
                          />
                        ) : (
                          <Fragment />
                        )}
                        {j === 0 && hasSubItems && !isExpanded ? (
                          <span className="table-details__subitems-badge">
                            {sortedSubItems.length}{' '}
                            {sortedSubItems.length === 1 ? 'subitem' : 'subitems'}
                          </span>
                        ) : null}
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
              {hasSubItems && isExpanded
                ? visibleSubItems.map((sub, subIdx) => {
                    const subKey = `${key}-sub-${sub.base && sub.base.index}-${
                      sub.compare && sub.compare.index
                    }`;
                    const isLastSubRow =
                      subIdx === visibleSubItems.length - 1 && hiddenUnchangedCount === 0;
                    return (
                      <tr key={subKey} className="table-details__sub-row">
                        {subHeadings.map((subHeading, j) => {
                          const subItemType = subHeading.valueType || 'unknown';
                          const subDiff = sub.diffs.find(
                            /** @return {diff is LHCI.NumericItemAuditDiff} */
                            diff => diff.type === 'itemDelta' && diff.itemKey === subHeading.key
                          );
                          const compareSubVal =
                            subHeading.key && sub.compare
                              ? sub.compare.item[subHeading.key]
                              : undefined;
                          const baseSubVal =
                            subHeading.key && sub.base ? sub.base.item[subHeading.key] : undefined;

                          return (
                            <Fragment key={j}>
                              <td
                                className={clsx(`table-column--${subItemType}`, {
                                  'table-details__tree-guide': j === 0,
                                  'table-details__tree-guide--last': j === 0 && isLastSubRow,
                                })}
                              >
                                {compareSubVal != null || baseSubVal != null ? (
                                  <SimpleDetails
                                    type={subItemType}
                                    compareValue={compareSubVal}
                                    baseValue={baseSubVal}
                                    diff={subDiff}
                                  />
                                ) : (
                                  <Fragment />
                                )}
                              </td>
                              {insertRowLabelAfterIndex === j ? (
                                <td className="table-column--row-label">
                                  {sub.state === 'added' || sub.state === 'removed'
                                    ? sub.state
                                    : ''}
                                </td>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tr>
                    );
                  })
                : null}
              {hasSubItems && isExpanded && hiddenUnchangedCount > 0 ? (
                <tr className="table-details__sub-row table-details__sub-row--show-more">
                  <td
                    colSpan={headings.length + 1}
                    className="table-details__tree-guide table-details__tree-guide--last"
                  >
                    <button
                      type="button"
                      className="table-details__show-unchanged-btn"
                      onClick={evt => {
                        evt.stopPropagation();
                        setShowUnchangedSubRows(prev => ({...prev, [key]: true}));
                      }}
                    >
                      + Show {hiddenUnchangedCount} unchanged{' '}
                      {hiddenUnchangedCount === 1 ? 'subitem' : 'subitems'}
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
};
