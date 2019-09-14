/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './audit-group.css';
import {Paper} from '../../../components/paper';
import {ScoreIcon} from '../../../components/score-icon';
import clsx from 'clsx';
import {AuditDiff} from './audit-diff';

/**
 * @param {{key?: string, group: {title: string}, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, audits: Array<LH.AuditResult>, baseLhr?: LH.Result, variant?: 'standard'|'numeric'}} props
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
            <div
              key={audit.id}
              className={clsx('audit-group__audit', {
                'audit-group__audit--selected': audit.id === props.selectedAuditId,
              })}
              onClick={() => props.setSelectedAuditId(audit.id || null)}
            >
              <div className="audit-group__audit-score">
                <ScoreIcon audit={audit} />
              </div>
              <div className="audit-group__audit-title">{audit.title}</div>
              <div className="audit-group__audit-diff">
                <AuditDiff audit={audit} baseAudit={baseAudit} />
              </div>
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
