/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {getDeltaLabel} from '@lhci/utils/src/audit-diff-finder';
import clsx from 'clsx';
import {Nbsp} from '../../../components/nbsp';
import './numeric-diff.css';

const BIG_PICTURE_LIMITS = {
  'first-contentful-paint': [0, 10000],
  'first-meaningful-paint': [0, 10000],
  'largest-contentful-paint': [0, 15000],
  'speed-index': [0, 15000],
  'first-cpu-idle': [0, 15000],
  interactive: [0, 20000],
  'estimated-input-latency': [0, 1500],
  'max-potential-fid': [0, 1500],
  'total-blocking-time': [0, 1500],
  __default__: [0, 30 * 1000],
};

/** @param {LH.AuditResult|undefined} audit @param {'lower'|'upper'} limitType */
const getBigPictureLimit = (audit, limitType) => {
  const auditId = /** @type {keyof typeof BIG_PICTURE_LIMITS} */ (audit && audit.id) || '';
  const limits = BIG_PICTURE_LIMITS[auditId] || BIG_PICTURE_LIMITS.__default__;
  return limits[limitType === 'lower' ? 0 : 1];
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
  if (/[0-9,.]+\s(ms|s)$/.test(displayValue)) return 'ms';
  if (/[0-9,.]+\s(KB|MB)$/.test(displayValue)) return 'bytes';

  return 'none';
};

/** @param {number} x @param {{asDelta?: boolean, unit: 'ms'|'bytes'|'none', withSuffix?: boolean, preventSecondsConversion?: boolean}} options */
const toDisplay = (x, options) => {
  const {asDelta = false, withSuffix = false, unit = 'none'} = options;
  let value = Math.round(x);
  let fractionDigits = 0;
  let suffixUnit = '';

  if (unit === 'ms') {
    suffixUnit = 'ms';

    if (Math.abs(value) >= 1000 && !options.preventSecondsConversion) {
      value /= 1000;
      fractionDigits = 1;
      suffixUnit = 's';
    }
  }

  if (unit === 'bytes') {
    suffixUnit = 'KB';
    value /= 1024;

    if (Math.abs(value) >= 500) {
      value /= 1024;
      fractionDigits = 1;
      suffixUnit = 'MB';
    }
  }

  if (unit === 'none') {
    if (Math.abs(value) >= 50) {
      value /= 1000;
      fractionDigits = 1;
      suffixUnit = 'K';
    }
  }

  const string = value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const numericSign = asDelta && value >= 0 ? '+' : '';
  const resultStr = numericSign + string + (withSuffix ? suffixUnit : '');
  return {
    element: (
      <span>
        {numericSign}
        {string}
        {withSuffix ? (
          <Fragment>
            <Nbsp />
            {suffixUnit}
          </Fragment>
        ) : (
          ''
        )}
      </span>
    ),
    string: resultStr,
    length: resultStr.length,
  };
};

/** @param {{diff: LHCI.NumericAuditDiff, audit?: LH.AuditResult, groupId?: string, showAsBigPicture?: boolean, showAsNarrow?: boolean}} props */
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
  const lowerLimit = props.showAsBigPicture
    ? getBigPictureLimit(audit, 'lower')
    : toNearestRoundNumber(minValue * 0.8, 'down');
  const upperLimit = props.showAsBigPicture
    ? getBigPictureLimit(audit, 'upper')
    : toNearestRoundNumber(maxValue * 1.2, 'up');
  const range = upperLimit - lowerLimit;

  const minValueConstrainted = Math.min(Math.max(minValue, lowerLimit), upperLimit);
  const maxValueConstrainted = Math.min(Math.max(maxValue, lowerLimit), upperLimit);
  const boxLeft = (100 * (minValueConstrainted - lowerLimit)) / range;
  const boxRight = 100 - (100 * (maxValueConstrainted - lowerLimit)) / range;
  const deltaType = getDeltaLabel(delta, 'audit');
  const minValueIsCurrentValue = minValue === currentNumericValue;
  const hoverDisplay = `${toDisplay(baseNumericValue, {unit, withSuffix: true}).string} to ${
    toDisplay(currentNumericValue, {
      withSuffix: true,
      unit,
    }).string
  }`;

  if (props.showAsNarrow) {
    return (
      <div className={clsx('audit-numeric-diff', `text--${deltaType}`)} data-tooltip={hoverDisplay}>
        {
          toDisplay(delta, {asDelta: true, withSuffix: true, preventSecondsConversion: true, unit})
            .element
        }
      </div>
    );
  }

  // We want to ensure there's ~10px per character of space for the delta label.
  // The min-width of the bar is ~300px, so if the deltaLabel is going to take up more than
  // the narrowCutoffThresholdInPercent we want to flip it over to the other side.
  const {element: deltaLabel, length: deltaLabelLength} = toDisplay(delta, {
    asDelta: true,
    withSuffix: true,
    preventSecondsConversion: true,
    unit,
  });
  const narrowCutoffThresholdInPercent = (deltaLabelLength * 10 * 100) / 300;

  return (
    <Fragment>
      <div className="audit-numeric-diff">
        <div className="audit-numeric-diff__left-label">
          {toDisplay(lowerLimit, {unit}).element}
        </div>
        <div className="audit-numeric-diff__bar">
          <div
            className={clsx('audit-numeric-diff__box', {
              'audit-numeric-diff__box--improvement': deltaType === 'improvement',
              'audit-numeric-diff__box--regression': deltaType === 'regression',
            })}
            style={{left: `${boxLeft}%`, right: `${boxRight}%`}}
            data-tooltip={hoverDisplay}
          >
            <div
              className="audit-numeric-diff__now"
              style={{left: minValueIsCurrentValue ? '0%' : '100%'}}
            />
            <div
              className={clsx('audit-numeric-diff__delta-label', {
                'audit-numeric-diff__delta-label--narrow-left':
                  deltaType === 'improvement' && boxLeft < narrowCutoffThresholdInPercent,
                'audit-numeric-diff__delta-label--narrow-right':
                  deltaType === 'regression' && boxRight < narrowCutoffThresholdInPercent,
              })}
              style={{[minValueIsCurrentValue ? 'right' : 'left']: '100%'}}
            >
              {deltaLabel}
            </div>
          </div>
        </div>
        <div className="audit-numeric-diff__right-label">
          {toDisplay(upperLimit, {unit}).element}
        </div>
      </div>
    </Fragment>
  );
};
