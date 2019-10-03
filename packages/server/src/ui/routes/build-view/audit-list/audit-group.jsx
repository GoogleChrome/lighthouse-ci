/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './audit-group.css';
import {Paper} from '../../../components/paper';
import {ScoreIcon} from '../../../components/score-icon';
import clsx from 'clsx';
import {AuditDiff} from './audit-diff';

/**
 * @param {{key?: string, group: {id: string, title: string}, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result, variant?: 'standard'|'numeric'}} props
 */
export const AuditGroup = props => {
  const {group, pairs} = props;

  return (
    <Paper className="audit-group">
      <div className="audit-group__title">{group.title}</div>
      <div className="audit-group__audits">
        {pairs.map(pair => {
          const {audit} = pair;

          // Only metrics are allowed to display the numericValue diff in this view.
          if (group.id !== 'metrics') {
            pair = {...pair, diffs: pair.diffs.filter(diff => diff.type !== 'numericValue')};
          }

          return (
            <div
              key={audit.id}
              className={clsx('audit-group__audit')}
              onClick={() => props.setSelectedAuditId(audit.id || null)}
            >
              <div className="audit-group__audit-score">
                <ScoreIcon score={audit.score || 0} />
              </div>
              <div className="audit-group__audit-title">{audit.title}</div>
              <div className="audit-group__audit-diff">
                <AuditDiff pair={pair} />
              </div>
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
