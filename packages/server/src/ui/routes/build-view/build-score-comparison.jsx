/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './build-score-comparison.css';
import clsx from 'clsx';

import {Gauge} from '../../components/gauge';
import {getDiffLabel} from '@lhci/utils/src/audit-diff-finder';

/** @param {number} score */
const renderScore = score => Math.round(score * 100);

/**
 * @param {{build: LHCI.ServerCommand.Build | null, lhr?: LH.Result, baseLhr?: LH.Result}} props
 */
export const BuildScoreComparison = props => {
  const {lhr, baseLhr} = props;
  if (!lhr) return null;

  return (
    <div className="build-score-comparison">
      {Object.keys(lhr.categories).map(id => {
        const category = lhr.categories[id];
        let deltaEl = null;
        let classes = '';
        /** @type {LHCI.NumericAuditDiff|undefined} */
        let diff = undefined;

        if (baseLhr) {
          const baseCategory = baseLhr.categories[id];
          if (baseCategory) {
            diff = {
              auditId: '',
              type: 'score',
              baseValue: baseCategory.score,
              compareValue: category.score,
            };

            const delta = renderScore(category.score - baseCategory.score);

            classes = `build-score-comparison-item--${getDiffLabel(diff)}`;

            deltaEl = (
              <div className={clsx('build-score-comparison-item__delta')}>
                {delta < 0 ? delta : `+${delta}`}
              </div>
            );
          }
        }

        return (
          <div key={id} className={clsx('build-score-comparison-item', classes)}>
            <Gauge score={category.score} diff={diff} />
            <div className="build-score-comparison-item__label">{category.title}</div>
            {deltaEl}
          </div>
        );
      })}
    </div>
  );
};
