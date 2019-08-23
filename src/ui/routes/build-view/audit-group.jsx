/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './audit-group.css';
import {Paper} from '../../components/paper';

/** @param {{audit: LH.AuditResult, baseAudit?: LH.AuditResult}} props */
const StandardDiff = props => {
  if (!props.baseAudit) return <span>No diff available</span>;

  return (
    <Fragment>
      <ScoreIcon audit={props.baseAudit} />
      <span className="audit-group__diff-arrow">→</span>
      <ScoreIcon audit={props.audit} />
    </Fragment>
  );
};

/** @param {{audit: LH.AuditResult}} props */
const ScoreIcon = props => {
  const score = props.audit.score || 0;
  if (score >= 0.9) return <i className="lh-score-pass" />;
  if (score >= 0.5) return <i className="lh-score-average" />;
  return <i className="lh-score-fail" />;
};

/**
 * @param {{key?: string, group: {title: string}, audits: Array<LH.AuditResult>, baseLhr?: LH.Result, variant?: 'standard'|'numeric'}} props
 */
export const AuditGroup = props => {
  const {group, audits, baseLhr} = props;

  return (
    <Paper className="audit-group">
      <div className="audit-group__title">{group.title}</div>
      <div className="audit-group__audits">
        {audits.map(audit => {
          const baseAudit = baseLhr && baseLhr.audits[audit.id || ''];

          return (
            <div key={audit.id} className="audit-group__audit">
              <div className="audit-group__audit-score">
                <ScoreIcon audit={audit} />
              </div>
              <div className="audit-group__audit-title">{audit.title}</div>
              <div className="audit-group__audit-diff">
                <StandardDiff audit={audit} baseAudit={baseAudit} />
              </div>
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
