/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useMemo, useCallback} from 'preact/hooks';
import {Link, route} from 'preact-router';
import clsx from 'clsx';
import './build-view.css';
import * as _ from '@lhci/utils/src/lodash.js';

import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {
  useBuild,
  useOptionalBuildById,
  useOptionalBuildRepresentativeRuns,
  useAncestorBuild,
  useProjectBySlug,
  useBuildStatistics,
} from '../../hooks/use-api-data';
import {BuildHashSelector} from './build-hash-selector';
import {BuildSelectorHeaderSection} from './build-selector-header-section';
import {Page} from '../../layout/page';

import {BuildViewWarnings, computeWarnings} from './build-view-warnings';
import {DocumentTitle} from '../../components/document-title';
import {LoadingSpinner} from '../../components/loading-spinner';
import {LhrComparison} from './lhr-comparison.jsx';
import {Dropdown} from '../../components/dropdown';
import {
  groupUrlsByPageType,
  createGroupedDropdownOptions,
  getUrlsForGroup,
  getGroupName,
  aggregateStatistics,
} from '../../utils/url-grouping.js';

/**
 * @param {{compareUrl?: string, runs: Array<LHCI.ServerCommand.Run>}} props
 * @param {Array<LHCI.ServerCommand.Run>} compareRuns
 * @return {string} */
function computeSelectedUrl(props, compareRuns) {
  if (props.compareUrl) return props.compareUrl;
  if (!compareRuns.length) return '';

  // Choose the shortest URL that exists in both of the builds fallingback to whatever was available in the compare.
  const fallbackUrl = compareRuns[0].url;
  const groupedUrls = _.groupBy(props.runs, run => run.url);
  const urlsInBothRuns = groupedUrls
    .filter(group => new Set(group.map(entry => entry.buildId)).size > 1)
    .map(group => group[0].url)
    .sort((a, b) => a.length - b.length);
  return urlsInBothRuns[0] || fallbackUrl;
}

/**
 * Compute a default URL for a build's runs, picking the shortest available.
 * @param {Array<LHCI.ServerCommand.Run>} runs
 * @return {string}
 */
function computeShortestUrl(runs) {
  if (!runs.length) return '';
  const urls = [...new Set(runs.map(r => r.url))];
  urls.sort((a, b) => a.length - b.length);
  return urls[0];
}

/**
 * Compute independent default URLs for base and compare builds.
 * Tries to pick the same URL if it exists in both builds; otherwise picks the shortest in each.
 * @param {Array<LHCI.ServerCommand.Run>} compareRuns
 * @param {Array<LHCI.ServerCommand.Run>} baseRuns
 * @return {{defaultBaseUrl: string, defaultCompareUrl: string}}
 */
function computeIndependentDefaults(compareRuns, baseRuns) {
  const compareUrls = new Set(compareRuns.map(r => r.url));
  const baseUrls = new Set(baseRuns.map(r => r.url));

  // Find URLs present in both builds, sorted by length (shortest first)
  const sharedUrls = [...compareUrls].filter(u => baseUrls.has(u)).sort((a, b) => a.length - b.length);

  if (sharedUrls.length > 0) {
    return {defaultBaseUrl: sharedUrls[0], defaultCompareUrl: sharedUrls[0]};
  }

  return {
    defaultBaseUrl: computeShortestUrl(baseRuns),
    defaultCompareUrl: computeShortestUrl(compareRuns),
  };
}

/** @param {{baseStats: Array, compareStats: Array, groupName: string}} props */
const GroupComparisonView = props => {
  const {baseStats, compareStats, groupName} = props;

  const METRICS = [
    {name: 'category_performance_median', label: 'Performance Score', format: /** @param {number} v */ v => Math.round(v * 100), unit: '', higherIsBetter: true},
    {name: 'category_accessibility_median', label: 'Accessibility Score', format: /** @param {number} v */ v => Math.round(v * 100), unit: '', higherIsBetter: true},
    {name: 'category_best-practices_median', label: 'Best Practices Score', format: /** @param {number} v */ v => Math.round(v * 100), unit: '', higherIsBetter: true},
    {name: 'category_seo_median', label: 'SEO Score', format: /** @param {number} v */ v => Math.round(v * 100), unit: '', higherIsBetter: true},
    {name: 'audit_first-contentful-paint_median', label: 'FCP', format: /** @param {number} v */ v => (v / 1000).toFixed(1), unit: 's', higherIsBetter: false},
    {name: 'audit_largest-contentful-paint_median', label: 'LCP', format: /** @param {number} v */ v => (v / 1000).toFixed(1), unit: 's', higherIsBetter: false},
    {name: 'audit_interactive_median', label: 'TTI', format: /** @param {number} v */ v => (v / 1000).toFixed(1), unit: 's', higherIsBetter: false},
    {name: 'audit_speed-index_median', label: 'SI', format: /** @param {number} v */ v => (v / 1000).toFixed(1), unit: 's', higherIsBetter: false},
    {name: 'audit_total-blocking-time_median', label: 'TBT', format: /** @param {number} v */ v => Math.round(v), unit: 'ms', higherIsBetter: false},
    {name: 'audit_max-potential-fid_median', label: 'FID', format: /** @param {number} v */ v => Math.round(v), unit: 'ms', higherIsBetter: false},
    {name: 'audit_cumulative-layout-shift_median', label: 'CLS', format: /** @param {number} v */ v => v.toFixed(3), unit: '', higherIsBetter: false},
  ];

  /** @param {Array} stats @param {string} name */
  const findStat = (stats, name) => {
    const stat = stats.find(s => s.name === name);
    return stat ? stat.value : undefined;
  };

  /** @param {number} delta @param {boolean} higherIsBetter */
  const getDeltaClass = (delta, higherIsBetter) => {
    if (Math.abs(delta) < 0.001) return 'group-comparison__delta--neutral';
    const isImproved = higherIsBetter ? delta > 0 : delta < 0;
    return isImproved ? 'group-comparison__delta--improved' : 'group-comparison__delta--regressed';
  };

  /** @param {number} delta @param {string} unit @param {boolean} higherIsBetter @param {function} format */
  const formatDelta = (delta, unit, higherIsBetter, format) => {
    if (Math.abs(delta) < 0.001) return '--';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${format(delta)}${unit}`;
  };

  const hasData = baseStats.length > 0 || compareStats.length > 0;

  if (!hasData) {
    return (
      <div className="group-comparison">
        <h2 className="group-comparison__title">{groupName} - Group Comparison</h2>
        <p className="group-comparison__empty">No statistics available for this group.</p>
      </div>
    );
  }

  // Separate into category scores and audit metrics
  const categoryMetrics = METRICS.filter(m => m.name.startsWith('category_'));
  const auditMetrics = METRICS.filter(m => m.name.startsWith('audit_'));

  return (
    <div className="group-comparison">
      <h2 className="group-comparison__title">{groupName} - Group Comparison</h2>

      <div className="group-comparison__section">
        <h3 className="group-comparison__section-title">Category Scores</h3>
        <table className="group-comparison__table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Base</th>
              <th>Compare</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            {categoryMetrics.map(metric => {
              const baseVal = findStat(baseStats, metric.name);
              const compareVal = findStat(compareStats, metric.name);
              const hasBoth = baseVal !== undefined && compareVal !== undefined;
              const delta = hasBoth ? compareVal - baseVal : 0;

              return (
                <tr key={metric.name}>
                  <td className="group-comparison__metric-name">{metric.label}</td>
                  <td className="group-comparison__value">
                    {baseVal !== undefined ? `${metric.format(baseVal)}${metric.unit}` : '--'}
                  </td>
                  <td className="group-comparison__value">
                    {compareVal !== undefined ? `${metric.format(compareVal)}${metric.unit}` : '--'}
                  </td>
                  <td className={clsx('group-comparison__delta', hasBoth && getDeltaClass(delta, metric.higherIsBetter))}>
                    {hasBoth ? formatDelta(delta, metric.unit, metric.higherIsBetter, metric.format) : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="group-comparison__section">
        <h3 className="group-comparison__section-title">Key Metrics</h3>
        <table className="group-comparison__table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Base</th>
              <th>Compare</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            {auditMetrics.map(metric => {
              const baseVal = findStat(baseStats, metric.name);
              const compareVal = findStat(compareStats, metric.name);
              const hasBoth = baseVal !== undefined && compareVal !== undefined;
              const delta = hasBoth ? compareVal - baseVal : 0;

              return (
                <tr key={metric.name}>
                  <td className="group-comparison__metric-name">{metric.label}</td>
                  <td className="group-comparison__value">
                    {baseVal !== undefined ? `${metric.format(baseVal)}${metric.unit}` : '--'}
                  </td>
                  <td className="group-comparison__value">
                    {compareVal !== undefined ? `${metric.format(compareVal)}${metric.unit}` : '--'}
                  </td>
                  <td className={clsx('group-comparison__delta', hasBoth && getDeltaClass(delta, metric.higherIsBetter))}>
                    {hasBoth ? formatDelta(delta, metric.unit, metric.higherIsBetter, metric.format) : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, runs: Array<LHCI.ServerCommand.Run>, baseUrl?: string, compareUrl?: string, hasBaseOverride: boolean}} props */
const BuildView_ = props => {
  const [openBuildHash, setOpenBuild] = useState(/** @type {null|'base'|'compare'} */ (null));
  const [isOpenLhrBaseLinkHovered, setLhrBaseLinkHover] = useState(false);
  const [isOpenLhrCompareLinkHovered, setLhrCompareLinkHover] = useState(false);
  const [compareMode, setCompareMode] = useState(/** @type {'individual'|'group'} */ ('individual'));
  const [selectedGroup, setSelectedGroup] = useState(/** @type {string|undefined} */ (undefined));
  const buildHashSelectorCloseFn = useCallback(() => setOpenBuild(null), [setOpenBuild]);

  const compareRuns = props.runs.filter(run => run.buildId === props.build.id);
  const ancestorBuildId = props.ancestorBuild && props.ancestorBuild.id;
  const baseRuns = props.runs.filter(run => run.buildId === ancestorBuildId);

  // Independent URL defaults for individual mode
  const {defaultBaseUrl, defaultCompareUrl} = useMemo(
    () => computeIndependentDefaults(compareRuns, baseRuns),
    [compareRuns.length, baseRuns.length]
  );

  const compareUrl = props.compareUrl || defaultCompareUrl;
  const baseUrl = props.baseUrl || defaultBaseUrl;

  const availableCompareUrls = [...new Set(compareRuns.map(run => run.url))];
  const availableBaseUrls = [...new Set(baseRuns.map(run => run.url))];

  const run = compareRuns.find(run => run.url === compareUrl);
  const baseRun = baseRuns.find(run => run.url === baseUrl);

  const compareUrlOptions = availableCompareUrls.map(url => ({value: url, label: decodeURI(url)}));
  const baseUrlOptions = availableBaseUrls.map(url => ({value: url, label: decodeURI(url)}));

  // Group mode data
  const compareUrlObjects = useMemo(
    () => availableCompareUrls.map(url => ({url})),
    [availableCompareUrls.join(',')]
  );
  const groups = useMemo(() => groupUrlsByPageType(compareUrlObjects), [compareUrlObjects]);
  const groupOptions = useMemo(() => createGroupedDropdownOptions(groups), [groups]);
  const activeGroup = selectedGroup || (groupOptions.length > 0 ? groupOptions[0].value : '');

  // Statistics for group mode - only fetch when in group mode
  const projectId = props.project.id;
  const buildId = props.build.id;
  const compareBuildIds = useMemo(
    () => (compareMode === 'group' ? [buildId] : undefined),
    [compareMode, buildId]
  );
  const baseBuildIds = useMemo(
    () => (compareMode === 'group' && ancestorBuildId ? [ancestorBuildId] : undefined),
    [compareMode, ancestorBuildId]
  );

  const [compareStatsLoading, compareStatsData] = useBuildStatistics(projectId, compareBuildIds);
  const [baseStatsLoading, baseStatsData] = useBuildStatistics(projectId, baseBuildIds);

  // Aggregate stats for selected group
  const groupUrls = useMemo(() => {
    if (compareMode !== 'group' || !activeGroup) return [];
    return getUrlsForGroup(activeGroup, compareUrlObjects);
  }, [compareMode, activeGroup, compareUrlObjects]);

  // For base build, construct URL objects from base runs
  const baseUrlObjects = useMemo(
    () => availableBaseUrls.map(url => ({url})),
    [availableBaseUrls.join(',')]
  );
  const baseGroupUrls = useMemo(() => {
    if (compareMode !== 'group' || !activeGroup) return [];
    return getUrlsForGroup(activeGroup, baseUrlObjects);
  }, [compareMode, activeGroup, baseUrlObjects]);

  const aggregatedCompareStats = useMemo(() => {
    if (compareMode !== 'group' || !compareStatsData || groupUrls.length === 0) return [];
    return aggregateStatistics(compareStatsData, getGroupName(activeGroup));
  }, [compareMode, compareStatsData, groupUrls]);

  const aggregatedBaseStats = useMemo(() => {
    if (compareMode !== 'group' || !baseStatsData || baseGroupUrls.length === 0) return [];
    return aggregateStatistics(baseStatsData, getGroupName(activeGroup));
  }, [compareMode, baseStatsData, baseGroupUrls]);

  const groupName = activeGroup ? getGroupName(activeGroup) : '';
  const displayGroupName = groups.find(g => g.value === activeGroup);

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

  // In group mode, we don't need a specific run/lhr, so skip the "no runs" check
  if (compareMode === 'individual' && (!run || !lhr)) {
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

  const definedLhr = lhr;
  const warningProps = definedLhr
    ? {
        lhr: definedLhr,
        build: props.build,
        baseBuild: props.ancestorBuild,
        baseLhr: baseLhr,
        hasBaseOverride: props.hasBaseOverride,
      }
    : null;

  const compareModeToggle = (
    <div className="build-view__compare-mode-toggle">
      <div
        className={clsx('build-view__compare-mode-option', {
          'build-view__compare-mode-option--active': compareMode === 'individual',
        })}
        onClick={() => setCompareMode('individual')}
      >
        Individual
      </div>
      <div
        className={clsx('build-view__compare-mode-option', {
          'build-view__compare-mode-option--active': compareMode === 'group',
        })}
        onClick={() => setCompareMode('group')}
      >
        Grouped
      </div>
    </div>
  );

  return (
    <Page
      headerLeft={
        <Link href={`/app/projects/${props.project.slug}`}>
          <i className="material-icons">arrow_back</i>
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
            setLhrLinkHover={setLhrBaseLinkHover}
            onClick={() => setOpenBuild(openBuildHash === 'base' ? null : 'base')}
          />
          <BuildSelectorHeaderSection
            build={props.build}
            variant="compare"
            lhr={lhr}
            isDimmed={openBuildHash === 'base'}
            isOpen={openBuildHash === 'compare'}
            setLhrLinkHover={setLhrCompareLinkHover}
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
      {openBuildHash ? (
        <BuildHashSelector
          build={props.build}
          ancestorBuild={props.ancestorBuild}
          selector={openBuildHash}
          lhr={lhr}
          baseLhr={baseLhr}
          baseBranch={props.project.baseBranch}
          close={buildHashSelectorCloseFn}
        />
      ) : (
        <Fragment />
      )}
      {(lhrError && <h1>Error parsing LHR ({lhrError.stack})</h1>) || <Fragment />}
      {compareMode === 'individual' && lhr ? (
        <LhrComparison
          lhr={lhr}
          baseLhr={baseLhr}
          className={clsx({
            'build-view--with-lhr-base-link-hover': isOpenLhrBaseLinkHovered,
            'build-view--with-lhr-compare-link-hover': isOpenLhrCompareLinkHovered,
          })}
          hookElements={{
            warnings: warningProps && computeWarnings(warningProps).hasWarning ? (
              <BuildViewWarnings {...warningProps} />
            ) : undefined,
            dropdowns: (
              <Fragment>
                {compareModeToggle}
                <Dropdown
                  label="Base URL"
                  className="dropdown--url dropdown--base-url"
                  value={baseUrl}
                  setValue={url => {
                    const to = new URL(window.location.href);
                    to.searchParams.set('baseUrl', url);
                    to.searchParams.set('compareUrl', compareUrl);
                    route(`${to.pathname}${to.search}`);
                  }}
                  options={baseUrlOptions}
                />
                <Dropdown
                  label="Compare URL"
                  className="dropdown--url dropdown--compare-url"
                  value={compareUrl}
                  setValue={url => {
                    const to = new URL(window.location.href);
                    to.searchParams.set('baseUrl', baseUrl);
                    to.searchParams.set('compareUrl', url);
                    route(`${to.pathname}${to.search}`);
                  }}
                  options={compareUrlOptions}
                />
              </Fragment>
            ),
          }}
        />
      ) : compareMode === 'group' ? (
        <div className="build-view__group-mode">
          <div className="build-view__group-controls">
            {compareModeToggle}
            <Dropdown
              label="Page Type"
              className="dropdown--url dropdown--page-type"
              value={activeGroup}
              setValue={setSelectedGroup}
              options={groupOptions}
            />
          </div>
          {compareStatsLoading === 'loading' || baseStatsLoading === 'loading' ? (
            <LoadingSpinner />
          ) : (
            <GroupComparisonView
              baseStats={aggregatedBaseStats}
              compareStats={aggregatedCompareStats}
              groupName={displayGroupName ? displayGroupName.label : groupName}
            />
          )}
        </div>
      ) : (
        <Fragment />
      )}
    </Page>
  );
};

/** @param {{projectSlug: string, partialBuildId: string, baseBuild?: string, baseUrl?: string, compareUrl?: string}} props */
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
          baseUrl={props.baseUrl}
          compareUrl={props.compareUrl}
          ancestorBuild={ancestorBuild}
          runs={runs.concat(baseRuns)}
          hasBaseOverride={!!props.baseBuild}
        />
      )}
    />
  );
};
