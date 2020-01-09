/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import clsx from 'clsx';
import _ from '@lhci/utils/src/lodash';
import {findAuditDiffs, getDiffSeverity} from '@lhci/utils/src/audit-diff-finder';

import {Dropdown} from '../../components/dropdown';
import {AuditDetailPane} from './audit-detail/audit-detail-pane';
import {LhrComparisonScores} from './lhr-comparison-scores';
import {AuditGroup} from './audit-list/audit-group';
import {LhrComparisonLegend} from './lhr-comparison-legend';
import {Paper} from '../../components/paper';
import {LhrViewerLink} from '../../components/lhr-viewer-link';

import './lhr-comparison.css';

/** @typedef {{id: string, audits: Array<LH.AuditResult>, group: {id: string, title: string}}} IntermediateAuditGroupDef */
/** @typedef {{id: string, pairs: Array<LHCI.AuditPair>, group: {id: string, title: string}}} AuditGroupDef */

/**
 * @param {LH.Result} lhr
 * @param {LH.Result|undefined} baseLhr
 * @param {{percentAbsoluteDeltaThreshold: number}} options
 * @return {Array<AuditGroupDef>}
 */
export function computeAuditGroups(lhr, baseLhr, options) {
  /** @type {Array<IntermediateAuditGroupDef|undefined>} */
  const rawAuditGroups = Object.entries(lhr.categories)
    .map(([categoryId, category]) => {
      const auditRefsGroupedByGroup = _.groupBy(category.auditRefs, ref => ref.group);
      return auditRefsGroupedByGroup.map(auditRefGroup => {
        let groupId = auditRefGroup[0].group || '';
        let group = lhr.categoryGroups && lhr.categoryGroups[groupId];
        if (!group) {
          if (auditRefsGroupedByGroup.length !== 1) return;
          groupId = `category:${categoryId}`;
          group = {title: category.title, description: category.description};
        }
        const audits = auditRefGroup
          .map(ref => ({...lhr.audits[ref.id], id: ref.id}))
          .sort((a, b) => (a.score || 0) - (b.score || 0));
        return {id: groupId, group: {...group, id: groupId}, audits};
      });
    })
    .reduce((a, b) => a.concat(b));
  /** @type {Array<AuditGroupDef>} */
  const auditGroups = [];
  for (const intermediateGroup of rawAuditGroups) {
    if (!intermediateGroup) continue;
    const auditPairs = intermediateGroup.audits
      .map(audit => {
        const baseAudit = baseLhr && baseLhr.audits[audit.id || ''];
        const diffs = baseAudit
          ? findAuditDiffs(baseAudit, audit, {...options, synthesizeItemKeyDiffs: true})
          : [];
        const maxSeverity = Math.max(...diffs.map(getDiffSeverity), 0);
        return {audit, baseAudit, diffs, maxSeverity, group: intermediateGroup.group};
      })
      .filter(pair => !pair.baseAudit || pair.diffs.length);
    const auditGroup = {
      id: intermediateGroup.id,
      group: intermediateGroup.group,
      pairs: auditPairs.sort((a, b) => (a.audit.score || 0) - (b.audit.score || 0)),
    };
    if (auditGroup.pairs.length) auditGroups.push(auditGroup);
  }
  return auditGroups;
}

/** @param {{hookElements: LHCI.HookElements<'dropdowns'>, selectedAuditId?: string | null, lhr?: LH.Result, baseLhr?: LH.Result, percentAbsoluteDeltaThreshold: number, setPercentAbsoluteDeltaThreshold: (x: number) => void}} props */
const LhrComparisonScoresAndUrl = props => {
  return (
    <div className="lhr-comparison__scores-and-dropdowns">
      <div className="container">
        <div className="lhr-comparison__dropdowns">
          {props.hookElements.dropdowns}
          <Dropdown
            label="Threshold"
            value={props.percentAbsoluteDeltaThreshold.toString()}
            setValue={value => {
              props.setPercentAbsoluteDeltaThreshold(Number(value));
            }}
            options={[
              {value: '0', label: '0%'},
              {value: '0.05', label: '5%'},
              {value: '0.1', label: '10%'},
              {value: '0.15', label: '15%'},
              {value: '0.25', label: '25%'},
            ]}
          />
        </div>
        {props.selectedAuditId ? <Fragment /> : <LhrComparisonScores {...props} />}
      </div>
    </div>
  );
};

/** @param {{auditGroups: Array<AuditGroupDef|undefined>, baseLhr?: LH.Result, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, showAsNarrow: boolean}} props */
const AuditGroups = props => {
  return (
    <div className="lhr-comparison__audit-groups">
      {props.auditGroups.map(auditGroup => {
        if (!auditGroup) return undefined;
        return (
          <AuditGroup
            key={auditGroup.id}
            showAsNarrow={props.showAsNarrow}
            pairs={auditGroup.pairs}
            group={auditGroup.group}
            baseLhr={props.baseLhr}
            selectedAuditId={props.selectedAuditId}
            setSelectedAuditId={props.setSelectedAuditId}
          />
        );
      })}
    </div>
  );
};

/** @param {{lhr: LH.Result, baseLhr: LH.Result|undefined, hookElements: LHCI.HookElements<'dropdowns'|'warnings'>, className?: string}} props */
export const LhrComparison = props => {
  const {lhr, baseLhr} = props;
  const [percentAbsoluteDeltaThreshold, setDiffThreshold] = useState(0.05);
  const [selectedAuditId, setAuditId] = useState(/** @type {string|null} */ (null));

  // Attach the LHRs to the window for easy debugging.
  useEffect(() => {
    // @ts-ignore
    window.__LHR__ = lhr;
    // @ts-ignore
    window.__BASE_LHR__ = baseLhr;
  }, [lhr, baseLhr]);

  const auditGroups = computeAuditGroups(lhr, baseLhr, {percentAbsoluteDeltaThreshold});

  return (
    <Fragment>
      {selectedAuditId ? (
        <AuditDetailPane
          selectedAuditId={selectedAuditId}
          setSelectedAuditId={setAuditId}
          pairs={auditGroups.map(group => group.pairs).reduce((a, b) => a.concat(b))}
          baseLhr={baseLhr}
        />
      ) : (
        <Fragment />
      )}
      <div
        className={clsx('lhr-comparison', props.className, {
          'lhr-comparison--with-audit-selection': !!selectedAuditId,
        })}
      >
        <LhrComparisonScoresAndUrl
          lhr={lhr}
          baseLhr={baseLhr}
          selectedAuditId={selectedAuditId}
          hookElements={props.hookElements}
          percentAbsoluteDeltaThreshold={percentAbsoluteDeltaThreshold}
          setPercentAbsoluteDeltaThreshold={setDiffThreshold}
        />
        <div className="container">
          {props.hookElements.warnings}
          {auditGroups.length && baseLhr ? (
            <Fragment>
              {selectedAuditId ? null : (
                <div className="lhr-comparison__legend-container">
                  <LhrComparisonLegend />
                </div>
              )}
              <AuditGroups
                showAsNarrow={!!selectedAuditId}
                auditGroups={auditGroups}
                baseLhr={baseLhr}
                selectedAuditId={selectedAuditId}
                setSelectedAuditId={setAuditId}
              />
            </Fragment>
          ) : props.hookElements.warnings ? null : (
            <Paper className="lhr-comparison__warning">
              <i className="material-icons">sentiment_satisfied_alt</i>
              <div>
                Woah, no differences found! Switch base builds to explore other differences, or{' '}
                <LhrViewerLink className="lhr-comparison__warning__lhr-link" lhr={props.lhr}>
                  jump straight to the Lighthouse report.
                </LhrViewerLink>
              </div>
            </Paper>
          )}
        </div>
      </div>
    </Fragment>
  );
};
