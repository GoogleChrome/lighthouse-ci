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
import clsx from 'clsx';

/** @type {Record<string, string>} */
const ICONS_BY_AUDIT_ID = {
  'font-display': 'font_download',
  'uses-rel-preconnect': 'language',

  'user-timings': 'timer',
  'bootup-time': 'speed',
  'mainthread-work-breakdown': 'speed',

  'third-party-summary': 'language',

  deprecations: 'error',
  'errors-in-console': 'error',
  'font-sizes': 'format_size',
};

/** @param {{audit: LH.AuditResult, groupId: string}} props */
const IconForAuditItems = props => {
  const auditId = props.audit.id || '';
  const groupId = props.groupId || '';

  let icon = '';
  if (groupId.includes('opportunities')) icon = 'web_asset';
  if (groupId.includes('a11y')) icon = 'code';
  if (auditId.includes('image')) icon = 'photo';
  icon = ICONS_BY_AUDIT_ID[auditId] || icon || 'list_alt';

  return <i className="material-icons">{icon}</i>;
};

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

/** @param {{diffs: Array<LHCI.AuditDiff>, audit: LH.AuditResult, baseAudit: LH.AuditResult, groupId: string, showAsNarrow?: boolean}} props */
export const ItemDiff = props => {
  const {diffs, baseAudit, groupId} = props;
  const baseAuditItems = (baseAudit.details && baseAudit.details.items) || [];

  const rowIndexes = getUniqueBaseCompareIndexPairs(diffs);
  const rowLabels = rowIndexes
    .map(pair => getRowLabelForIndex(diffs, pair.compare, pair.base))
    .map(getDiffLabelForRowLabel);

  const regressionCount = rowLabels.filter(label => label === 'regression').length;
  const improvementCount = rowLabels.filter(label => label === 'improvement').length;

  const baseElements = (
    <Fragment>
      <div className="audit-group__diff-badge-group">
        <IconForAuditItems audit={props.audit} groupId={groupId} />
        <div className="audit-group__diff-badges">
          <span className="audit-group__diff-badge">{baseAuditItems.length}</span>
        </div>
      </div>
      <i
        className={`material-icons audit-group__diff-arrow audit-group__diff-arrow--${
          improvementCount > regressionCount ? 'improvement' : 'regression'
        }`}
      >
        arrow_forward
      </i>
    </Fragment>
  );

  return (
    <Fragment>
      {props.showAsNarrow ? <Fragment /> : baseElements}
      <div className={clsx(`audit-group__diff-badge-group`)}>
        <IconForAuditItems audit={props.audit} groupId={groupId} />
        <div
          className={clsx('audit-group__diff-badges', {
            'audit-group__diff-badge-group--multiple': Boolean(regressionCount && improvementCount),
          })}
        >
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
    </Fragment>
  );
};

const NoBaseAudit = () => (
  <div className="audit-group__error-message" data-tooltip="Audit did not run in the base report">
    <i className="material-icons">error_outline</i> Audit Missing
  </div>
);

/** @param {{audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */
const ErrorDiff = props => {
  let message = 'An unknown error occurred while trying to compare the audit results.';
  if (props.audit.scoreDisplayMode === 'error') {
    message = `Audit in compare report errored: ${props.audit.errorMessage}`;
  } else if (props.baseAudit.scoreDisplayMode === 'error') {
    message = `Audit in base report errored: ${props.baseAudit.errorMessage}`;
  }

  return (
    <div className="audit-group__error-message" data-tooltip={message}>
      <i className="material-icons">error_outline</i> Audit Error
    </div>
  );
};

/** @param {{pair: LHCI.AuditPair, showAsBigPicture: boolean, showAsNarrow: boolean}} props */
export const AuditDiff = props => {
  const {audit, baseAudit, diffs, group} = props.pair;
  const noDiffAvailable = <span>No diff available</span>;

  if (!baseAudit) return <NoBaseAudit />;

  const errorDiff = diffs.find(diff => diff.type === 'error');
  if (errorDiff) return <ErrorDiff audit={audit} baseAudit={baseAudit} />;

  const numericDiff = diffs.find(diff => diff.type === 'numericValue');
  if (numericDiff && numericDiff.type === 'numericValue') {
    return (
      <NumericDiff
        diff={numericDiff}
        audit={audit}
        groupId={group.id}
        showAsBigPicture={props.showAsBigPicture}
        showAsNarrow={props.showAsNarrow}
      />
    );
  }

  const hasItemDiff = diffs.some(
    diff => diff.type === 'itemAddition' || diff.type === 'itemRemoval' || diff.type === 'itemDelta'
  );
  if (hasItemDiff) {
    return (
      <ItemDiff
        diffs={diffs}
        audit={audit}
        baseAudit={baseAudit}
        groupId={group.id}
        showAsNarrow={props.showAsNarrow}
      />
    );
  }

  const scoreDiff = diffs.find(diff => diff.type === 'score');
  if (scoreDiff) return <ScoreDiff diff={scoreDiff} audit={audit} baseAudit={baseAudit} />;

  const displayValueDiff = diffs.find(diff => diff.type === 'displayValue');
  if (!displayValueDiff || displayValueDiff.type !== 'displayValue') return noDiffAvailable;
  return <DisplayValueDiff diff={displayValueDiff} audit={audit} baseAudit={baseAudit} />;
};
