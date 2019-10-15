/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as _ from '@lhci/utils/src/lodash';
import {h, Fragment} from 'preact';
import {ScoreWord} from '../../../components/score-icon';
import {NumericDiff} from './numeric-diff';
import {getDiffLabel, getRowLabelForIndex} from '@lhci/utils/src/audit-diff-finder';

/** @param {{diff: LHCI.AuditDiff, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const ScoreDiff = props => {
  return (
    <Fragment>
      <ScoreWord audit={props.baseAudit} />
      <i
        className={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${getDiffLabel(
          props.diff
        )}`}
      >
        arrow_forward
      </i>
      <ScoreWord audit={props.audit} />
    </Fragment>
  );
};

/** @param {{diff: LHCI.DisplayValueAuditDiff, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const DisplayValueDiff = props => {
  return (
    <Fragment>
      <span>{props.diff.baseValue}</span>
      <i
        className={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${getDiffLabel(
          props.diff
        )}`}
      >
        arrow_forward
      </i>
      <span>{props.diff.compareValue}</span>
    </Fragment>
  );
};

/** @param {import('@lhci/utils/src/audit-diff-finder').RowLabel} rowLabel @return {'regression'|'improvement'|'neutral'} */
function getDiffLabelForRowLabel(rowLabel) {
  switch (rowLabel) {
    case 'added':
    case 'worse':
    case 'ambiguous':
      return 'regression';
    case 'removed':
    case 'better':
      return 'improvement';
    case 'no change':
      return 'neutral';
  }
}

/** @param {Array<LHCI.AuditDiff>} diffs */
function getUniqueBaseCompareIndexPairs(diffs) {
  return _.uniqBy(
    diffs
      .map(diff => ({
        base: 'baseItemIndex' in diff ? diff.baseItemIndex : undefined,
        compare: 'compareItemIndex' in diff ? diff.compareItemIndex : undefined,
      }))
      .filter(indexes => typeof indexes.base === 'number' || typeof indexes.compare === 'number'),
    idx => `${idx.base}-${idx.compare}`
  );
}

/** @param {{diffs: Array<LHCI.AuditDiff>, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
export const ItemDiff = props => {
  const {diffs, baseAudit} = props;
  if (!baseAudit.details || !baseAudit.details.items) return null;

  const rowIndexes = getUniqueBaseCompareIndexPairs(diffs);
  const rowLabels = rowIndexes
    .map(pair => getRowLabelForIndex(diffs, pair.compare, pair.base))
    .map(getDiffLabelForRowLabel);

  const regressionCount = rowLabels.filter(label => label === 'regression').length;
  const improvementCount = rowLabels.filter(label => label === 'improvement').length;

  return (
    <Fragment>
      <div className="audit-group__diff-badge-group">
        <i className="material-icons">list</i>
        <div className="audit-group__diff-badges">
          <span className="audit-group__diff-badge">{baseAudit.details.items.length}</span>
        </div>
      </div>
      <i
        className={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${
          improvementCount > regressionCount ? 'improvement' : 'regression'
        }`}
      >
        arrow_forward
      </i>
      <div className="audit-group__diff-badge-group">
        <i className="material-icons">list</i>
        <div className="audit-group__diff-badges">
          {regressionCount ? (
            <span className="audit-group__diff-badge audit-group__diff-badge--regression">
              {regressionCount}
            </span>
          ) : null}
          {improvementCount ? (
            <span className="audit-group__diff-badge audit-group__diff-badge--improvement">
              {improvementCount}
            </span>
          ) : null}
        </div>
      </div>
      {/* Apply a bit of a spacer to prevent the overflow from leaking outside the boundaries of the box. */}
      <div style={{width: 10}} />
    </Fragment>
  );
};

/** @param {{pair: LHCI.AuditPair}} props */
export const AuditDiff = props => {
  const {audit, baseAudit, diffs, group} = props.pair;
  const noDiffAvailable = <span>No diff available</span>;

  if (!baseAudit) return noDiffAvailable;

  const numericDiff = diffs.find(diff => diff.type === 'numericValue');
  if (numericDiff && numericDiff.type === 'numericValue') {
    return <NumericDiff diff={numericDiff} audit={audit} groupId={group.id} />;
  }

  const hasItemDiff = diffs.some(
    diff => diff.type === 'itemAddition' || diff.type === 'itemRemoval' || diff.type === 'itemDelta'
  );
  if (hasItemDiff) {
    return <ItemDiff diffs={diffs} audit={audit} baseAudit={baseAudit} />;
  }

  const scoreDiff = diffs.find(diff => diff.type === 'score');
  if (scoreDiff) return <ScoreDiff diff={scoreDiff} audit={audit} baseAudit={baseAudit} />;

  const displayValueDiff = diffs.find(diff => diff.type === 'displayValue');
  if (!displayValueDiff || displayValueDiff.type !== 'displayValue') return noDiffAvailable;
  return <DisplayValueDiff diff={displayValueDiff} audit={audit} baseAudit={baseAudit} />;
};
