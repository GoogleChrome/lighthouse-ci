/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './lhr-comparison-scores.css';
import clsx from 'clsx';

import {Gauge} from '../../components/gauge';
import {
  PWAGauge,
  getBadgeStatus,
  FastReliableIcon,
  InstallableIcon,
  OptimizedIcon,
  getBadgeDiffType,
} from '../../components/pwa-gauge';
import {ScoreDeltaBadge} from '../../components/score-delta-badge';

/** @param {{lhr: LH.Result, baseLhr?: LH.Result, categoryId: string}} props */
const StandardScoreItem = props => {
  const {lhr, baseLhr, categoryId} = props;
  const category = lhr.categories[categoryId];
  const baseCategory = baseLhr && baseLhr.categories[categoryId];
  /** @type {LHCI.NumericAuditDiff|undefined} */
  const diff = baseCategory && {
    auditId: '',
    type: 'score',
    baseValue: baseCategory.score,
    compareValue: category.score,
  };

  return (
    <div key={categoryId} className={clsx('lhr-comparison-scores-item')}>
      <Gauge score={category.score} diff={diff} />
      <div className="lhr-comparison-scores-item__label">{category.title}</div>
      {diff ? <ScoreDeltaBadge diff={diff} className="lhr-comparison-scores-item__delta" /> : null}
    </div>
  );
};

/** @param {{lhr: LH.Result, baseLhr?: LH.Result, categoryId: string}} props */
const PwaScoreItem = props => {
  const {lhr, baseLhr, categoryId} = props;
  const compareStatus = getBadgeStatus(lhr);
  let deltaEl;
  const overallStatus = 'neutral';

  if (baseLhr) {
    const baseStatus = getBadgeStatus(baseLhr);
    const diffTypes = {
      fastAndReliable: getBadgeDiffType(baseStatus, compareStatus, 'fastAndReliable'),
      installable: getBadgeDiffType(baseStatus, compareStatus, 'installable'),
      optimized: getBadgeDiffType(baseStatus, compareStatus, 'optimized'),
    };
    const allEqual = Object.values(diffTypes).every(type => type === 'neutral');

    const individualBadges = (
      <Fragment>
        {diffTypes.fastAndReliable === 'neutral' ? (
          <Fragment />
        ) : (
          <FastReliableIcon deltaType={diffTypes.fastAndReliable} />
        )}
        {diffTypes.installable === 'neutral' ? (
          <Fragment />
        ) : (
          <InstallableIcon deltaType={diffTypes.installable} />
        )}
        {diffTypes.optimized === 'neutral' ? (
          <Fragment />
        ) : (
          <OptimizedIcon deltaType={diffTypes.optimized} />
        )}
      </Fragment>
    );

    deltaEl = (
      <div className={clsx('lhr-comparison-scores-item__delta')}>
        {allEqual ? '-' : individualBadges}
      </div>
    );
  }

  return (
    <div
      key={categoryId}
      className={clsx(
        'lhr-comparison-scores-item',
        `lhr-comparison-scores-item--pwa`,
        `lhr-comparison-scores-item--${overallStatus}`
      )}
    >
      <PWAGauge status={compareStatus} />
      <div className="lhr-comparison-scores-item__label">PWA</div>
      {deltaEl}
    </div>
  );
};

/**
 * @param {{lhr?: LH.Result, baseLhr?: LH.Result}} props
 */
export const LhrComparisonScores = props => {
  const {lhr, baseLhr} = props;
  if (!lhr) return null;

  const categoryIds = Object.keys(lhr.categories);

  return (
    <div className="lhr-comparison-scores">
      {categoryIds
        .sort((idA, idB) => {
          const sortKeyA = idA === 'pwa' ? Infinity : categoryIds.indexOf(idA);
          const sortKeyB = idB === 'pwa' ? Infinity : categoryIds.indexOf(idB);
          return sortKeyA - sortKeyB;
        })
        .map(id => {
          return id === 'pwa' ? (
            <PwaScoreItem lhr={lhr} baseLhr={baseLhr} categoryId={id} />
          ) : (
            <StandardScoreItem lhr={lhr} baseLhr={baseLhr} categoryId={id} />
          );
        })}
    </div>
  );
};
