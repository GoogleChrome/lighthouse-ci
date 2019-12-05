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
import {useState} from 'preact/hooks';

/**
 * @param {{key?: string, group: {id: string, title: string}, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result, showAsNarrow: boolean}} props
 */
export const AuditGroup = props => {
  const {group, pairs} = props;
  const [showAsBigPicture, setShowAsBigPicture] = useState(group.id === 'metrics');

  return (
    <Paper className="audit-group">
      <div className="audit-group__header">
        <div className="audit-group__title">{group.title}</div>
        {group.id === 'metrics' && !props.showAsNarrow ? (
          <div className="audit-group__big-picture-tabs">
            <span
              className={clsx('big-picture-tabs__tab', {
                'big-picture-tabs__tab--selected': showAsBigPicture,
              })}
              onClick={() => setShowAsBigPicture(true)}
            >
              Overview
            </span>
            <span
              className={clsx('big-picture-tabs__tab', {
                'big-picture-tabs__tab--selected': !showAsBigPicture,
              })}
              onClick={() => setShowAsBigPicture(false)}
            >
              Magnified
            </span>
          </div>
        ) : (
          <Fragment />
        )}
      </div>
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
                <AuditDiff
                  pair={pair}
                  showAsBigPicture={showAsBigPicture}
                  showAsNarrow={props.showAsNarrow}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
