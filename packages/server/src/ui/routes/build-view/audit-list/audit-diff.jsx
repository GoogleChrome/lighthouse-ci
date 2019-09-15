/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {ScoreIcon} from '../../../components/score-icon';
import {NumericDiff} from './numeric-diff';

/** @param {{audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const StandardDiff = props => {
  return (
    <Fragment>
      <ScoreIcon audit={props.baseAudit} />
      <span className="audit-group__diff-arrow">→</span>
      <ScoreIcon audit={props.audit} />
    </Fragment>
  );
};

/** @param {{diff: LHCI.NumericAuditDiff}} props */
const ItemCountDiff = props => {
  return (
    <Fragment>
      {props.diff.baseValue} item(s)
      <span className="audit-group__diff-arrow">→</span>
      {props.diff.compareValue} item(s)
    </Fragment>
  );
};

/** @param {{pair: LHCI.AuditPair}} props */
export const AuditDiff = props => {
  const {audit, baseAudit, diffs} = props.pair;

  if (!baseAudit) return <span>No diff available</span>;

  const numericDiff = diffs.find(diff => diff.type === 'numericValue');
  if (numericDiff && numericDiff.type === 'numericValue') {
    return <NumericDiff diff={numericDiff} />;
  }

  const itemCountDiff = diffs.find(diff => diff.type === 'itemCount');
  if (itemCountDiff && itemCountDiff.type === 'itemCount' && itemCountDiff.baseValue !== 0) {
    return <ItemCountDiff diff={itemCountDiff} />;
  }

  return <StandardDiff audit={audit} baseAudit={baseAudit} />;
};
