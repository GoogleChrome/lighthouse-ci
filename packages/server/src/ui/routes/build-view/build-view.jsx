/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import _ from '@lhci/utils/src/lodash';
import {useState, useMemo} from 'preact/hooks';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Dropdown} from '../../components/dropdown';
import {
  useProject,
  useBuild,
  useOptionalBuildByHash,
  useOptionalBuildRepresentativeRuns,
  useAncestorBuild,
} from '../../hooks/use-api-data';
import {BuildHashSelector} from './build-hash-selector';
import {BuildSelectorPill} from './build-selector-pill';
import {AuditDetailPane} from './audit-detail/audit-detail-pane';
import {Page} from '../../layout/page';
import {BuildScoreComparison} from './build-score-comparison';
import {AuditGroup} from './audit-list/audit-group';

import './build-view.css';
import {BuildViewLegend} from './build-view-legend';
import clsx from 'clsx';
import {findAuditDiffs, getDiffSeverity} from '@lhci/utils/src/audit-diff-finder';
import {BuildViewEmpty} from './build-view-empty';
import {route} from 'preact-router';

/**
 * @param {LH.Result} lhr
 * @param {LH.Result|undefined} baseLhr
 * @return {Array<AuditGroupDef>}
 */
function computeAuditGroups(lhr, baseLhr) {
  /** @type {Array<IntermediateAuditGroupDef|undefined>} */
  const rawAuditGroups = Object.values(lhr.categories)
    .map(category => {
      const auditRefsGroupedByGroup = _.groupBy(category.auditRefs, ref => ref.group);
      return auditRefsGroupedByGroup.map(auditRefGroup => {
        const groupId = auditRefGroup[0].group || '';
        const group = lhr.categoryGroups && lhr.categoryGroups[groupId];
        if (!group) return;

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
        const diffs = baseAudit ? findAuditDiffs(baseAudit, audit) : [];
        const maxSeverity = Math.max(...diffs.map(getDiffSeverity), 0);
        return {audit, baseAudit, diffs, maxSeverity, group: intermediateGroup.group};
      })
      .filter(pair => !pair.baseAudit || pair.diffs.length);

    const auditGroup = {
      id: intermediateGroup.id,
      group: intermediateGroup.group,
      pairs: auditPairs.sort((a, b) => b.maxSeverity - a.maxSeverity),
    };

    if (auditGroup.pairs.length) auditGroups.push(auditGroup);
  }

  return auditGroups;
}

/** @typedef {{id: string, audits: Array<LH.AuditResult>, group: {id: string, title: string}}} IntermediateAuditGroupDef */
/** @typedef {{id: string, pairs: Array<LHCI.AuditPair>, group: {id: string, title: string}}} AuditGroupDef */

/** @param {{selectedUrl: string, build: LHCI.ServerCommand.Build | null, lhr?: LH.Result, baseLhr?: LH.Result, urls: Array<string>}} props */
const BuildViewScoreAndUrl = props => {
  return (
    <div className="build-view__scores-and-url">
      <div className="container">
        <Dropdown
          className="build-view__url-dropdown"
          value={props.selectedUrl}
          setValue={url => {
            const to = new URL(window.location.href);
            to.searchParams.set('compareUrl', url);
            route(`${to.pathname}${to.search}`);
          }}
          options={props.urls.map(url => ({value: url, label: url}))}
        />
        <BuildScoreComparison {...props} />
      </div>
    </div>
  );
};

/** @param {{auditGroups: Array<AuditGroupDef|undefined>, baseLhr?: LH.Result, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void}} props */
const AuditGroups = props => {
  return (
    <div className="build-view__audit-groups">
      {props.auditGroups.map(auditGroup => {
        if (!auditGroup) return undefined;
        return (
          <AuditGroup
            key={auditGroup.id}
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

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, runs: Array<LHCI.ServerCommand.Run>, compareUrl?: string}} props */
const BuildView_ = props => {
  const [openBuildHash, setOpenBuild] = useState(/** @type {null|'base'|'compare'} */ (null));
  const [selectedAuditId, setAuditId] = useState(/** @type {string|null} */ (null));
  const selectedUrl = props.compareUrl || (props.runs[0] && props.runs[0].url);

  const compareRuns = props.runs.filter(run => run.buildId === props.build.id);
  const availableUrls = [...new Set(compareRuns.map(run => run.url))];
  const run = compareRuns.find(run => run.url === selectedUrl);

  const ancestorBuildId = props.ancestorBuild && props.ancestorBuild.id;
  const baseRuns = props.runs.filter(run => run.buildId === ancestorBuildId);
  const baseRun = baseRuns.find(run => run.url === selectedUrl);

  /** @type {LH.Result|undefined} */
  let lhr;
  /** @type {LH.Result|undefined} */
  let baseLhr;
  /** @type {Error|undefined} */
  let lhrError;

  try {
    lhr = useMemo(() => run && JSON.parse(run.lhr), [run]);
  } catch (err) {
    lhrError = err;
  }

  try {
    baseLhr = useMemo(() => baseRun && JSON.parse(baseRun.lhr), [baseRun]);
  } catch (err) {
    lhrError = err;
  }

  if (!run || !lhr) {
    return (
      <Fragment>
        <h1>No runs for build</h1>
        <pre>
          {lhrError}
          {JSON.stringify(props, null, 2)}
        </pre>
      </Fragment>
    );
  }

  const auditGroups = computeAuditGroups(lhr, baseLhr);

  return (
    <Page
      header={
        <Fragment>
          <BuildSelectorPill
            build={props.ancestorBuild}
            variant="base"
            isOpen={openBuildHash === 'base'}
            onClick={() => setOpenBuild(openBuildHash === 'base' ? null : 'base')}
          />
          <BuildSelectorPill
            build={props.build}
            variant="compare"
            isOpen={openBuildHash === 'compare'}
            onClick={() => setOpenBuild(openBuildHash === 'compare' ? null : 'compare')}
          />
        </Fragment>
      }
    >
      {(openBuildHash && (
        <BuildHashSelector
          build={props.build}
          ancestorBuild={props.ancestorBuild}
          selector={openBuildHash}
          lhr={lhr}
          baseLhr={baseLhr}
        />
      )) || <Fragment />}
      {(selectedAuditId && (
        <AuditDetailPane
          selectedAuditId={selectedAuditId}
          setSelectedAuditId={setAuditId}
          pairs={auditGroups.map(group => group.pairs).reduce((a, b) => a.concat(b))}
          baseLhr={baseLhr}
        />
      )) || <Fragment />}
      {(lhrError && <h1>Error parsing LHR ({lhrError.stack})</h1>) || <Fragment />}
      <div
        className={clsx('build-view', {
          'build-view--with-audit-selection': !!selectedAuditId,
        })}
      >
        <BuildViewScoreAndUrl
          build={props.build}
          lhr={lhr}
          baseLhr={baseLhr}
          selectedUrl={selectedUrl}
          urls={availableUrls}
        />
        <div className="container">
          <BuildViewLegend />
          {auditGroups.length && baseLhr ? (
            <AuditGroups
              auditGroups={auditGroups}
              baseLhr={baseLhr}
              selectedAuditId={selectedAuditId}
              setSelectedAuditId={setAuditId}
            />
          ) : (
            <BuildViewEmpty lhr={lhr} />
          )}
        </div>
      </div>
    </Page>
  );
};

/** @param {{projectId: string, buildId: string, baseHash?: string, compareUrl?: string}} props */
export const BuildView = props => {
  const projectLoadingData = useProject(props.projectId);
  const buildLoadingData = useBuild(props.projectId, props.buildId);
  const ancestorBuildData = useAncestorBuild(props.projectId, props.buildId);

  const baseOverrideOptions = props.baseHash ? {ancestorHash: props.baseHash} : buildLoadingData[1];
  const baseOverrideData = useOptionalBuildByHash(props.projectId, baseOverrideOptions);

  const baseBuildData =
    props.baseHash || (ancestorBuildData[0] === 'loaded' && !ancestorBuildData[1])
      ? baseOverrideData
      : ancestorBuildData;
  const baseBuildId = baseBuildData[1] && baseBuildData[1].id;

  const runData = useOptionalBuildRepresentativeRuns(props.projectId, props.buildId, null);

  const baseRunData = useOptionalBuildRepresentativeRuns(
    props.projectId,
    baseBuildId === null ? 'EMPTY_QUERY' : baseBuildId,
    null
  );

  return (
    <AsyncLoader
      loadingState={combineLoadingStates(
        projectLoadingData,
        buildLoadingData,
        baseBuildData,
        runData,
        baseRunData
      )}
      asyncData={combineAsyncData(
        projectLoadingData,
        buildLoadingData,
        baseBuildData,
        runData,
        baseRunData
      )}
      renderLoading={() => (
        <Page>
          <h1>Loading...</h1>
        </Page>
      )}
      render={([project, build, ancestorBuild, runs, baseRuns]) => (
        <BuildView_
          project={project}
          build={build}
          compareUrl={props.compareUrl}
          ancestorBuild={ancestorBuild}
          runs={runs.concat(baseRuns)}
        />
      )}
    />
  );
};
