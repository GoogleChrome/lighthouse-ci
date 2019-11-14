/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import _ from '@lhci/utils/src/lodash';
import {useState, useMemo, useCallback, useEffect} from 'preact/hooks';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Dropdown} from '../../components/dropdown';
import {
  useBuild,
  useOptionalBuildById,
  useOptionalBuildRepresentativeRuns,
  useAncestorBuild,
  useProjectBySlug,
} from '../../hooks/use-api-data';
import {BuildHashSelector} from './build-hash-selector';
import {BuildSelectorHeaderSection} from './build-selector-header-section';
import {AuditDetailPane} from './audit-detail/audit-detail-pane';
import {Page} from '../../layout/page';
import {BuildScoreComparison} from './build-score-comparison';
import {AuditGroup} from './audit-list/audit-group';

import './build-view.css';
import {BuildViewLegend} from './build-view-legend';
import clsx from 'clsx';
import {findAuditDiffs, getDiffSeverity} from '@lhci/utils/src/audit-diff-finder';
import {route, Link} from 'preact-router';
import {BuildViewWarnings} from './build-view-warnings';
import {DocumentTitle} from '../../components/document-title';
import {LoadingSpinner} from '../../components/loading-spinner';

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

/** @typedef {{id: string, audits: Array<LH.AuditResult>, group: {id: string, title: string}}} IntermediateAuditGroupDef */
/** @typedef {{id: string, pairs: Array<LHCI.AuditPair>, group: {id: string, title: string}}} AuditGroupDef */

/** @param {{selectedUrl: string, selectedAuditId?: string | null, build: LHCI.ServerCommand.Build | null, lhr?: LH.Result, baseLhr?: LH.Result, urls: Array<string>, percentAbsoluteDeltaThreshold: number, setPercentAbsoluteDeltaThreshold: (x: number) => void}} props */
const BuildViewScoreAndUrl = props => {
  return (
    <div className="build-view__scores-and-url">
      <div className="container">
        <div className="build-view__dropdowns">
          <Dropdown
            label="URL"
            className="dropdown--url"
            value={props.selectedUrl}
            setValue={url => {
              const to = new URL(window.location.href);
              to.searchParams.set('compareUrl', url);
              route(`${to.pathname}${to.search}`);
            }}
            options={props.urls.map(url => ({value: url, label: url}))}
          />
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
        {props.selectedAuditId ? <Fragment /> : <BuildScoreComparison {...props} />}
      </div>
    </div>
  );
};

/** @param {{auditGroups: Array<AuditGroupDef|undefined>, baseLhr?: LH.Result, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, showAsNarrow: boolean}} props */
const AuditGroups = props => {
  return (
    <div className="build-view__audit-groups">
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

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, runs: Array<LHCI.ServerCommand.Run>, compareUrl?: string, hasBaseOverride: boolean}} props */
const BuildView_ = props => {
  const [percentAbsoluteDeltaThreshold, setDiffThreshold] = useState(0.05);
  const [openBuildHash, setOpenBuild] = useState(/** @type {null|'base'|'compare'} */ (null));
  const [selectedAuditId, setAuditId] = useState(/** @type {string|null} */ (null));
  const [isOpenLhrLinkHovered, setLhrLinkHover] = useState(false);
  const selectedUrl = props.compareUrl || (props.runs[0] && props.runs[0].url);
  const buildHashSelectorCloseFn = useCallback(() => setOpenBuild(null), [setOpenBuild]);

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

  // Attach the LHRs to the window for easy debugging.
  useEffect(() => {
    // @ts-ignore
    window.__LHR__ = lhr;
    // @ts-ignore
    window.__BASE_LHR__ = baseLhr;
  }, [lhr, baseLhr]);

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

  const auditGroups = computeAuditGroups(lhr, baseLhr, {percentAbsoluteDeltaThreshold});

  return (
    <Page
      headerLeft={
        <Link href={`/app/projects/${props.project.slug}`}>
          <i className="material-icons">arrow_backward</i>
        </Link>
      }
      header={
        <Fragment>
          <BuildSelectorHeaderSection
            build={props.ancestorBuild}
            variant="base"
            lhr={baseLhr}
            isDimmed={openBuildHash === 'compare'}
            isOpen={openBuildHash === 'base'}
            setLhrLinkHover={setLhrLinkHover}
            onClick={() => setOpenBuild(openBuildHash === 'base' ? null : 'base')}
          />
          <BuildSelectorHeaderSection
            build={props.build}
            variant="compare"
            lhr={lhr}
            isDimmed={openBuildHash === 'base'}
            isOpen={openBuildHash === 'compare'}
            setLhrLinkHover={setLhrLinkHover}
            onClick={() => setOpenBuild(openBuildHash === 'compare' ? null : 'compare')}
          />
        </Fragment>
      }
      headerRight={
        <a
          href="https://github.com/GoogleChrome/lighthouse-ci"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="material-icons">info</i>
        </a>
      }
    >
      <DocumentTitle title={`Compare "${props.build.commitMessage}"`} />
      {(openBuildHash && (
        <BuildHashSelector
          build={props.build}
          ancestorBuild={props.ancestorBuild}
          selector={openBuildHash}
          lhr={lhr}
          baseLhr={baseLhr}
          close={buildHashSelectorCloseFn}
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
          'build-view--with-lhr-link-hover': isOpenLhrLinkHovered,
        })}
      >
        <BuildViewScoreAndUrl
          build={props.build}
          lhr={lhr}
          baseLhr={baseLhr}
          selectedUrl={selectedUrl}
          selectedAuditId={selectedAuditId}
          urls={availableUrls}
          percentAbsoluteDeltaThreshold={percentAbsoluteDeltaThreshold}
          setPercentAbsoluteDeltaThreshold={setDiffThreshold}
        />
        <div className="container">
          <BuildViewWarnings
            lhr={lhr}
            build={props.build}
            auditGroups={auditGroups}
            baseBuild={props.ancestorBuild}
            baseLhr={baseLhr}
            hasBaseOverride={props.hasBaseOverride}
          />
          {auditGroups.length && baseLhr ? (
            <Fragment>
              {selectedAuditId ? (
                <Fragment />
              ) : (
                <div className="build-view__legend-and-options">
                  <BuildViewLegend />
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
          ) : (
            <Fragment />
          )}
        </div>
      </div>
    </Page>
  );
};

/** @param {{projectSlug: string, partialBuildId: string, baseBuild?: string, compareUrl?: string}} props */
export const BuildView = props => {
  const projectLoadingData = useProjectBySlug(props.projectSlug);
  const projectId = projectLoadingData[1] && projectLoadingData[1].id;
  const buildLoadingData = useBuild(projectId, props.partialBuildId);
  const buildId = buildLoadingData[1] && buildLoadingData[1].id;
  const ancestorBuildData = useAncestorBuild(projectId, buildId);

  const baseOverrideOptions = props.baseBuild ? props.baseBuild : null;
  const baseOverrideData = useOptionalBuildById(projectId, baseOverrideOptions);

  const baseBuildData = props.baseBuild ? baseOverrideData : ancestorBuildData;
  const baseBuildId = baseBuildData[1] && baseBuildData[1].id;

  const runData = useOptionalBuildRepresentativeRuns(projectId, buildId, null);

  const baseRunData = useOptionalBuildRepresentativeRuns(
    projectId,
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
          <LoadingSpinner />
        </Page>
      )}
      render={([project, build, ancestorBuild, runs, baseRuns]) => (
        <BuildView_
          project={project}
          build={build}
          compareUrl={props.compareUrl}
          ancestorBuild={ancestorBuild}
          runs={runs.concat(baseRuns)}
          hasBaseOverride={!!props.baseBuild}
        />
      )}
    />
  );
};
