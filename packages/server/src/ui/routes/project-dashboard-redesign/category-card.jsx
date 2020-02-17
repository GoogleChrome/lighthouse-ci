/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {AsyncLoader} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';

import './category-card.css';
import {CategoryScoreGraph} from './graphs/category-score/category-score-graph';
import clsx from 'clsx';
import {MetricLineGraph} from './graphs/metric-line-graph';
import {DonutGraph} from './graphs/donut-graph';
import {useRepresentativeRun, useLhr} from '../../hooks/use-api-data';
import {HoverCard} from './graphs/hover-card';
import {ScoreIcon} from '../../components/score-icon';

/** @typedef {import('./project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */
/** @typedef {import('../../hooks/use-api-data').LoadingState} LoadingState */
/** @typedef {{category: LH.CategoryResult, categoryGroups: LH.Result['categoryGroups'], statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[], buildLimit: number, setBuildLimit: (n: number) => void, lhr: LH.Result, url: string}} Props */
/** @typedef {Props & {statistics: Array<StatisticWithBuild>, latestBuild: LHCI.ServerCommand.Build|undefined, selectedBuildId: string|undefined, setSelectedBuildId: import('preact/hooks/src').StateUpdater<string|undefined>, pinned: boolean, setPinned: import('preact/hooks/src').StateUpdater<boolean>}} PropsWithState */
/** @typedef {{id: string, title?: string, pass: number, fail: number, na: number}} AuditGroupCounts */
/** @typedef {PropsWithState & {groupId: string, variant: 'pass'|'fail'}} PropsForHoverCard */

const BUILD_LIMIT_OPTIONS = [{value: 25}, {value: 50}, {value: 100}, {value: 150, label: 'Max'}];

/** @type {Record<LHCI.AssertCommand.Budget.TimingMetric, [number, number]>} */
const SCORE_LEVEL_METRIC_THRESHOLDS = {
  'first-contentful-paint': [2000, 4000],
  'first-meaningful-paint': [2000, 4000],
  'first-cpu-idle': [3000, 7500],
  interactive: [3000, 7500],
  'speed-index': [3000, 6000],
  'max-potential-fid': [100, 250],
};

/** @type {Record<string,string>} */
const AUDIT_GROUP_PREFIX_BY_CATEGORY_ID = {
  accessibility: 'a11y-',
  seo: 'seo-',
  pwa: 'pwa-',
};

/** @param {PropsWithState} props */
const PerformanceCategoryDetails = props => {
  /** @param {LHCI.ServerCommand.Statistic['name']} name */
  const stats = name => props.statistics.filter(s => s.name === name);

  return (
    <div className="performance-category-details__graphs">
      <MetricLineGraph
        pinned={props.pinned}
        setPinned={props.setPinned}
        selectedBuildId={props.selectedBuildId}
        setSelectedBuildId={props.setSelectedBuildId}
        metrics={[
          {
            abbreviation: 'FCP',
            label: 'First Contentful Paint',
            statistics: stats('audit_first-contentful-paint_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['first-contentful-paint'],
          },
          {
            abbreviation: 'TTI',
            label: 'Time to Interactive',
            statistics: stats('audit_interactive_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['interactive'],
          },
          {
            abbreviation: 'SI',
            label: 'Speed Index',
            statistics: stats('audit_speed-index_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['speed-index'],
          },
        ]}
      />
      <MetricLineGraph
        pinned={props.pinned}
        setPinned={props.setPinned}
        selectedBuildId={props.selectedBuildId}
        setSelectedBuildId={props.setSelectedBuildId}
        metrics={[
          {
            abbreviation: 'FCP',
            label: 'First Contentful Paint',
            statistics: stats('audit_first-contentful-paint_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['first-contentful-paint'],
          },
          {
            abbreviation: 'TTI',
            label: 'Time to Interactive',
            statistics: stats('audit_interactive_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['interactive'],
          },
          {
            abbreviation: 'SI',
            label: 'Speed Index',
            statistics: stats('audit_speed-index_average'),
            scoreLevels: SCORE_LEVEL_METRIC_THRESHOLDS['speed-index'],
          },
        ]}
      />
    </div>
  );
};

/** @param {{group: AuditGroupCounts, build: LHCI.ServerCommand.Build, url: string, variant: 'pass'|'fail'}} props */
const AuditListDisplayCard = props => {
  const [loadingState, run] = useRepresentativeRun(
    props.build.projectId,
    props.build.id,
    props.url
  );
  const maybeLhr = useLhr(run);
  return (
    <HoverCard
      className="audit-list-hover-card"
      url={props.url}
      build={props.build}
      pinned={false}
      hideActions
    >
      <AsyncLoader
        loadingState={loadingState}
        asyncData={maybeLhr}
        render={lhr => {
          if (!lhr) return <span>Failed to load results.</span>;
          /** @type {Set<LH.AuditResult['scoreDisplayMode']>} */
          const ignoredScoreDisplayModes = new Set(['manual', 'notApplicable', 'informative']);

          /** @type {Array<LH.AuditResult>} */
          const audits = [];
          for (const category of Object.values(lhr.categories)) {
            for (const auditRef of category.auditRefs) {
              if (auditRef.group !== props.group.id) continue;
              const audit = lhr.audits[auditRef.id];
              if (!audit || ignoredScoreDisplayModes.has(audit.scoreDisplayMode)) continue;
              if (props.variant === 'pass' && audit.score !== 1) continue;
              if (props.variant === 'fail' && audit.score === 1) continue;
              audits.push(audit);
            }
          }

          if (!audits.length) return <span>No matching audits found.</span>;
          return (
            <div className="audit-list-hover-card__list">
              {audits.map(audit => (
                <div key={audit.id} className="audit-list-hover-card__list-item">
                  <ScoreIcon score={audit.score || 0} />
                  <div className="audit-list-hover-card__list-item-title">{audit.title}</div>
                </div>
              ))}
            </div>
          );
        }}
      />
    </HoverCard>
  );
};

/** @param {{group: AuditGroupCounts, build: LHCI.ServerCommand.Build, url: string}} props */
const BasicCategoryDetailsAuditGroup = props => {
  const group = props.group;
  const [hoverCardDisplay, setHoverCardDisplay] = useState(/** @type {''|'pass'|'fail'} */ (''));

  return (
    <div key={group.title} className="basic-category-auditgroup">
      <div className="basic-category-auditgroup__title">{group.title}</div>
      <div
        className="basic-category-auditgroup__count-block"
        onMouseEnter={() => setHoverCardDisplay('pass')}
        onMouseLeave={() => setHoverCardDisplay('')}
      >
        <span className="text--pass">{group.pass}</span>
        <span className="basic-category-auditgroup__count-block-label">Passed</span>
        {group.pass && hoverCardDisplay === 'pass' ? (
          <AuditListDisplayCard {...props} variant="pass" />
        ) : (
          <Fragment />
        )}
      </div>
      <div
        className="basic-category-auditgroup__count-block"
        onMouseEnter={() => setHoverCardDisplay('fail')}
        onMouseLeave={() => setHoverCardDisplay('')}
      >
        <span className="text--fail">{group.fail}</span>
        <span className="basic-category-auditgroup__count-block-label">Failed</span>
        {group.fail && hoverCardDisplay === 'fail' ? (
          <AuditListDisplayCard {...props} variant="fail" />
        ) : (
          <Fragment />
        )}
      </div>
      <DonutGraph passCount={group.pass || 0} failCount={group.fail || 0} naCount={group.na || 0} />
    </div>
  );
};

/** @param {PropsWithState} props */
const BasicCategoryDetails = props => {
  const prefix = AUDIT_GROUP_PREFIX_BY_CATEGORY_ID[props.category.id];
  if (!prefix || !props.latestBuild) return <Fragment />;

  const selectedBuildId = props.selectedBuildId || props.latestBuild.id;
  const lhr = props.lhr;
  const statistics = props.statistics.filter(
    s =>
      s.value !== -1 && s.name.startsWith(`auditgroup_${prefix}`) && selectedBuildId === s.buildId
  );
  if (!statistics.length) return <Fragment />;
  const build = statistics[0].build;
  const groups = _.groupBy(statistics, item => item.name.split('_')[1])
    .map(group => {
      const groupId = group[0].name.split('_')[1];
      const lhrGroup = lhr.categoryGroups && lhr.categoryGroups[groupId];
      if (!lhrGroup) return {id: '', title: '', pass: 0, fail: 0, na: 0};
      const pass = group.find(item => item.name.endsWith('pass'));
      const fail = group.find(item => item.name.endsWith('fail'));
      const na = group.find(item => item.name.endsWith('na'));

      return {
        ...lhrGroup,
        id: groupId,
        pass: pass ? pass.value : -1,
        fail: fail ? fail.value : -1,
        na: na ? na.value : -1,
      };
    })
    .filter(group => group.title)
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="basic-category-details">
      {groups.map(group => (
        <BasicCategoryDetailsAuditGroup
          key={group.id}
          group={group}
          build={build}
          url={props.url}
        />
      ))}
    </div>
  );
};

/** @param {PropsWithState} props */
const CategoryDetails = props => {
  if (props.category.id === 'performance') return <PerformanceCategoryDetails {...props} />;
  return <BasicCategoryDetails {...props} />;
};

/** @param {Props} props */
export const CategoryCard = props => {
  const [pinned, setPinned] = useState(false);
  const [selectedBuildId, setSelectedBuildId] = useState(
    /** @type {undefined|string} */ (undefined)
  );

  const categoryId = props.category.id;
  const id = `category-card__body--${categoryId}`;

  // Unpin when the user clicks out of the card
  useEffect(() => {
    /** @param {Event} e */
    const listener = e => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      if (!target.closest(`#${id}`) || !target.closest('.graph-root-el')) {
        setPinned(false);
        setSelectedBuildId(undefined);
      }
    };

    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [setPinned]);

  return (
    <Paper className="category-card">
      <div className="category-card__header">
        <h3 className="category-card__title">{props.category.title}</h3>
        <div className="category-card__build-limit">
          {BUILD_LIMIT_OPTIONS.map(option => (
            <span
              key={option.value}
              className={clsx('build-limit-option', {
                'build-limit-option--selected': props.buildLimit === option.value,
              })}
              onClick={() => props.setBuildLimit(option.value)}
            >
              {option.label || option.value}
            </span>
          ))}
        </div>
      </div>
      <div id={id} className="category-card__body">
        <AsyncLoader
          loadingState={props.loadingState}
          asyncData={props.statistics}
          renderLoading={() => <span>Loading, please wait...</span>}
          render={statistics => {
            const propsWithState = {
              ...props,
              statistics,
              latestBuild:
                statistics[statistics.length - 1] && statistics[statistics.length - 1].build,
              selectedBuildId,
              setSelectedBuildId,
              pinned,
              setPinned,
            };

            return (
              <Fragment>
                <CategoryScoreGraph {...propsWithState} />
                <CategoryDetails {...propsWithState} />
              </Fragment>
            );
          }}
        />
      </div>
    </Paper>
  );
};
