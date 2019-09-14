/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {getDeltaLabel} from '@lhci/utils/src/audit-diff-finder';
import clsx from 'clsx';

/** @param {LH.AuditResult} audit @return {number|undefined} */
export const getNumericValueForDiff = audit => {
  const {details, numericValue} = audit;
  if (typeof numericValue === 'number') return numericValue;
  if (details && typeof details.overallSavingsMs === 'number') return details.overallSavingsMs;
  return undefined;
};

/** @param {number} x @param {'up'|'down'} direction */
const toNearestRoundNumber = (x, direction) => {
  const fn = direction === 'up' ? Math.ceil : Math.floor;
  if (x < 10) return fn(x);
  if (x < 100) return fn(x / 10) * 10;
  if (x < 1000) return fn(x / 100) * 100;
  if (x < 10000) return fn(x / 1000) * 1000;
  return fn(x / 2500) * 2500;
};

/** @param {number} x */
const toDisplay = x => {
  let value = x;
  let fractionDigits = 1;
  if (Math.abs(x) >= 100) {
    fractionDigits = 0;
    value = Math.round(value * 10) / 10;
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

/** @param {{audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
export const NumericDiff = props => {
  const {audit, baseAudit} = props;
  const currentNumericValue = getNumericValueForDiff(audit);
  const baseNumericValue = getNumericValueForDiff(baseAudit);

  if (typeof baseNumericValue !== 'number' || typeof currentNumericValue !== 'number') {
    return <span>No diff available</span>;
  }

  const delta = currentNumericValue - baseNumericValue;
  const minValue = Math.min(currentNumericValue, baseNumericValue);
  const maxValue = Math.max(currentNumericValue, baseNumericValue);
  const lowerLimit = toNearestRoundNumber(minValue * 0.8, 'down');
  const upperLimit = toNearestRoundNumber(maxValue * 1.2, 'up');
  const range = upperLimit - lowerLimit;

  const boxLeft = (100 * (minValue - lowerLimit)) / range;
  const boxRight = 100 - (100 * (maxValue - lowerLimit)) / range;
  const deltaType = getDeltaLabel(delta, 'audit');
  const minValueIsCurrentValue = minValue === currentNumericValue;

  return (
    <Fragment>
      <div className="audit-numeric-diff">
        <div className="audit-numeric-diff__left-label">{toDisplay(lowerLimit)}</div>
        <div className="audit-numeric-diff__bar">
          <div
            className={clsx('audit-numeric-diff__box', {
              'audit-numeric-diff__box--improvement': deltaType === 'improvement',
              'audit-numeric-diff__box--regression': deltaType === 'regression',
            })}
            style={{left: `${boxLeft}%`, right: `${boxRight}%`}}
            title={`${toDisplay(baseNumericValue)} -> ${toDisplay(currentNumericValue)}`}
          >
            <div
              className="audit-numeric-diff__now"
              style={{left: minValueIsCurrentValue ? '0%' : '100%'}}
            />
            <div
              className="audit-numeric-diff__delta-label"
              style={{[minValueIsCurrentValue ? 'right' : 'left']: '100%'}}
            >
              {toDisplay(delta)}
            </div>
          </div>
        </div>
        <div className="audit-numeric-diff__right-label">{toDisplay(upperLimit)}</div>
      </div>
    </Fragment>
  );
};
