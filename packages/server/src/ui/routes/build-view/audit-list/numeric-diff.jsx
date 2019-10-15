/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {getDeltaLabel} from '@lhci/utils/src/audit-diff-finder';
import clsx from 'clsx';
import './numeric-diff.css';

/** @param {number} x @param {'up'|'down'} direction */
const toNearestRoundNumber = (x, direction) => {
  const fn = direction === 'up' ? Math.ceil : Math.floor;
  if (x < 10) return fn(x);
  if (x < 100) return fn(x / 10) * 10;
  if (x < 1000) return fn(x / 100) * 100;
  if (x < 10000) return fn(x / 1000) * 1000;
  return fn(x / 2500) * 2500;
};

/**
 * @param {LH.AuditResult|undefined} audit
 * @param {string|undefined} groupId
 * @return {'ms'|'bytes'|'none'}
 */
const getUnitFromAudit = (audit, groupId) => {
  if (groupId === 'metrics') return 'ms';
  if (groupId === 'load-opportunities') return 'ms';
  if (!audit) return 'none';

  if (audit.details) {
    const details = audit.details;
    if (details.overallSavingsMs) return 'ms';
  }

  const displayValue = audit.displayValue || '';
  if (/^[0-9,.]+\s(ms|s)$/.test(displayValue)) return 'ms';
  if (/^[0-9,.]+\s(KB|MB)$/.test(displayValue)) return 'bytes';

  return 'none';
};

/** @param {number} x @param {{asDelta?: boolean, unit: 'ms'|'bytes'|'none', withSuffix?: boolean}} options */
const toDisplay = (x, options) => {
  const {asDelta = false, withSuffix = false, unit = 'none'} = options;
  let value = Math.round(x);
  let fractionDigits = 0;
  let suffix = '';

  if (unit === 'ms') {
    suffix = ' ms';

    if (Math.abs(value) >= 50) {
      value /= 1000;
      fractionDigits = 1;
      suffix = ' s';
    }
  }

  if (unit === 'bytes') {
    suffix = ' KB';
    value /= 1024;

    if (Math.abs(value) >= 500) {
      value /= 1024;
      fractionDigits = 1;
      suffix = ' MB';
    }
  }

  if (unit === 'none') {
    if (Math.abs(value) >= 50) {
      value /= 1000;
      fractionDigits = 1;
      suffix = 'K';
    }
  }

  const string = value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return `${asDelta && value >= 0 ? '+' : ''}${string}${withSuffix ? suffix : ''}`;
};

/** @param {{diff: LHCI.NumericAuditDiff, audit?: LH.AuditResult, groupId?: string}} props */
export const NumericDiff = props => {
  const {diff, audit, groupId} = props;
  const unit = getUnitFromAudit(audit, groupId);
  const currentNumericValue = diff.compareValue;
  const baseNumericValue = diff.baseValue;

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
        <div className="audit-numeric-diff__left-label">{toDisplay(lowerLimit, {unit})}</div>
        <div className="audit-numeric-diff__bar">
          <div
            className={clsx('audit-numeric-diff__box', {
              'audit-numeric-diff__box--improvement': deltaType === 'improvement',
              'audit-numeric-diff__box--regression': deltaType === 'regression',
            })}
            style={{left: `${boxLeft}%`, right: `${boxRight}%`}}
            title={`${toDisplay(baseNumericValue, {unit, withSuffix: true})} -> ${toDisplay(
              currentNumericValue,
              {
                withSuffix: true,
                unit,
              }
            )}`}
          >
            <div
              className="audit-numeric-diff__now"
              style={{left: minValueIsCurrentValue ? '0%' : '100%'}}
            />
            <div
              className="audit-numeric-diff__delta-label"
              style={{[minValueIsCurrentValue ? 'right' : 'left']: '100%'}}
            >
              {toDisplay(delta, {asDelta: true, withSuffix: true, unit})}
            </div>
          </div>
        </div>
        <div className="audit-numeric-diff__right-label">{toDisplay(upperLimit, {unit})}</div>
      </div>
    </Fragment>
  );
};
