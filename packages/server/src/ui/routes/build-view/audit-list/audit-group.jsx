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
import {openLhrInClassicViewer} from '../../../components/lhr-viewer-link';

/** @typedef {{key?: string, group: {id: string, title: string}, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result, showAsNarrow: boolean, showAsUnchanged: boolean}} Props */

/** @param {Props & {showAsBigPicture: boolean, setShowAsBigPicture: (b: boolean) => void}} props */
const MetricsTabHeader = props => {
  return (
    <div className="audit-group__big-picture-tabs">
      <span
        className={clsx('big-picture-tabs__tab', {
          'big-picture-tabs__tab--selected': props.showAsBigPicture,
        })}
        onClick={() => props.setShowAsBigPicture(true)}
      >
        Overview
      </span>
      <span
        className={clsx('big-picture-tabs__tab', {
          'big-picture-tabs__tab--selected': !props.showAsBigPicture,
        })}
        onClick={() => props.setShowAsBigPicture(false)}
      >
        Magnified
      </span>
    </div>
  );
};

/** @param {Props & {showAsBigPicture: boolean}} props */
const ChangedAuditList = props => {
  return (
    <Fragment>
      {props.pairs.map(pair => {
        const {audit} = pair;

        // Only metrics are allowed to display the numericValue diff in this view.
        if (props.group.id !== 'metrics') {
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
                showAsBigPicture={props.showAsBigPicture}
                showAsNarrow={props.showAsNarrow}
              />
            </div>
          </div>
        );
      })}
    </Fragment>
  );
};

/** @param {Props & {expanded: boolean}} props */
const UnchangedAuditList = props => {
  const baseLhr = props.baseLhr;
  if (!baseLhr || !props.expanded) return <Fragment />;

  return (
    <Fragment>
      {props.pairs.map(pair => {
        const {audit} = pair;

        return (
          <div
            key={audit.id}
            className={clsx('audit-group__audit', 'audit-group__audit--unchanged')}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              openLhrInClassicViewer(baseLhr);
            }}
          >
            <div className="audit-group__audit-score">
              <ScoreIcon score={audit.score || 0} />
            </div>
            <div className="audit-group__audit-title">{audit.title}</div>
            <div className="audit-group__audit-diff">Open Report</div>
          </div>
        );
      })}
    </Fragment>
  );
};

/** @param {Props} props */
export const AuditGroup = props => {
  const {group} = props;
  const [showAsBigPicture, setShowAsBigPicture] = useState(group.id === 'metrics');
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      className={clsx('audit-group', {
        'audit-group--expanded': expanded,
        'audit-group--unchanged': props.showAsUnchanged,
      })}
    >
      <div className="audit-group__header" onClick={() => setExpanded(!expanded)}>
        <div className="audit-group__title">
          {group.title} {props.showAsUnchanged ? `(${props.pairs.length})` : ''}
        </div>
        <div className="audit-group__expand-toggle">
          <i className="material-icons">chevron_right</i>
        </div>
        {group.id === 'metrics' && !props.showAsNarrow ? (
          <MetricsTabHeader
            {...props}
            showAsBigPicture={showAsBigPicture}
            setShowAsBigPicture={setShowAsBigPicture}
          />
        ) : (
          <Fragment />
        )}
      </div>
      <div className="audit-group__audits">
        {props.showAsUnchanged ? (
          <UnchangedAuditList {...props} expanded={expanded} />
        ) : (
          <ChangedAuditList {...props} showAsBigPicture={showAsBigPicture} />
        )}
      </div>
    </Paper>
  );
};
