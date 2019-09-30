/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {ScoreWord} from '../../../components/score-icon';
import {NumericDiff} from './numeric-diff';
import {getDiffLabel} from '@lhci/utils/src/audit-diff-finder';

/** @param {{diff: LHCI.AuditDiff, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const StandardDiff = props => {
  return (
    <Fragment>
      <ScoreWord audit={props.baseAudit} />
      <i
        class={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${getDiffLabel(
          props.diff
        )}`}
      >
        arrow_forward
      </i>
      <ScoreWord audit={props.audit} />
    </Fragment>
  );
};

/** @param {{diffs: Array<LHCI.AuditDiff>, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const ItemDiff = props => {
  const {diffs, baseAudit} = props;
  if (!baseAudit.details || !baseAudit.details.items) return null;

  const seen = new Set();
  const diffsPerItem = diffs.filter(diff => {
    if (diff.type !== 'itemDelta') return true;
    const key = `${diff.baseItemIndex}-${diff.compareItemIndex}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const regressionDiffs = diffsPerItem.filter(diff => getDiffLabel(diff) === 'regression');
  const improvementDiffs = diffsPerItem.filter(diff => getDiffLabel(diff) === 'improvement');

  const itemDiffTypes = new Set(['itemRemoval', 'itemAddition', 'itemDelta']);
  const regressionCount = regressionDiffs.filter(diff => itemDiffTypes.has(diff.type)).length;
  const improvementCount = improvementDiffs.filter(diff => itemDiffTypes.has(diff.type)).length;

  return (
    <Fragment>
      <div class="audit-group__diff-badge-group">
        <i class="material-icons">list</i>
        <div class="audit-group__diff-badges">
          <span class="audit-group__diff-badge">{baseAudit.details.items.length}</span>
        </div>
      </div>
      <i
        class={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${
          improvementCount > regressionCount ? 'improvement' : 'regression'
        }`}
      >
        arrow_forward
      </i>
      <div class="audit-group__diff-badge-group">
        <i class="material-icons">list</i>
        <div class="audit-group__diff-badges">
          {regressionCount ? (
            <span class="audit-group__diff-badge audit-group__diff-badge--regression">
              {regressionCount}
            </span>
          ) : null}
          {improvementCount ? (
            <span class="audit-group__diff-badge audit-group__diff-badge--improvement">
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
  const {audit, baseAudit, diffs} = props.pair;
  const noDiffAvailable = <span>No diff available</span>;

  if (!baseAudit) return noDiffAvailable;

  const numericDiff = diffs.find(diff => diff.type === 'numericValue');
  if (numericDiff && numericDiff.type === 'numericValue') {
    return <NumericDiff diff={numericDiff} />;
  }

  const hasItemDiff = diffs.some(
    diff => diff.type === 'itemAddition' || diff.type === 'itemRemoval' || diff.type === 'itemDelta'
  );
  if (hasItemDiff) {
    return <ItemDiff diffs={diffs} audit={audit} baseAudit={baseAudit} />;
  }

  const scoreDiff = diffs.find(diff => diff.type === 'score');
  if (!scoreDiff) return noDiffAvailable;
  return <StandardDiff diff={scoreDiff} audit={audit} baseAudit={baseAudit} />;
};
