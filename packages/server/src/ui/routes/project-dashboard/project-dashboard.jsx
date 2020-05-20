/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import {route} from 'preact-router';
import _ from '@lhci/utils/src/lodash.js';
import {
  useProjectBuilds,
  useProjectBySlug,
  useProjectBranches,
  useBuildURLs,
} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Page} from '../../layout/page.jsx';
import {ProjectCategorySummaries} from './project-category-summaries.jsx';

import './project-dashboard.css';
import {Dropdown} from '../../components/dropdown';
import clsx from 'clsx';
import {ProjectBuildList} from './build-list';
import {DocumentTitle} from '../../components/document-title';
import {ProjectGettingStarted} from './getting-started';

/** @typedef {import('../../hooks/use-api-data').LoadingState} LoadingState */

/** @param {{branches: Array<{branch: string}>, branch?: string, baseBranch: string}} props */
const computeBranchSelection = props => {
  const availableBranches = props.branches.length ? props.branches : [{branch: props.baseBranch}];
  const selectedBranch =
    props.branch ||
    (availableBranches.some(b => b.branch === props.baseBranch)
      ? props.baseBranch
      : availableBranches[0].branch);
  return {
    availableBranches,
    selectedBranch,
  };
};

/** @param {{urls: Array<{url: string}>, runUrl?: string}} props */
const computeUrlSelection = props => {
  const availableUrls = props.urls.length ? props.urls : [{url: 'None'}];
  // Default to the shortest URL because that's usually the root homepage, e.g. `/`
  const shortestUrl = _.minBy(availableUrls.map(({url}) => url), url => url.length);
  const selectedUrl = props.runUrl || shortestUrl || 'None';

  return {
    availableUrls,
    selectedUrl,
  };
};

/**
 * Hooks can't return early, so we have to do some convoluted `undefined` gymnastics to create our URL query.
 * We only want the dropdown to be populated with URLs that are actually available on this branch.
 *
 *
 * @param {[LoadingState, LHCI.ServerCommand.Project | undefined]} projectData
 * @param {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]} buildData
 * @param {[LoadingState, Array<{branch: string}> | undefined]} branchData
 * @param {string|undefined} branchFromProps
 */
function useUrlsAvailableForBranch(projectData, buildData, branchData, branchFromProps) {
  const baseBranch = projectData[1] ? projectData[1].baseBranch || 'master' : undefined;
  const branches = branchData[1];
  const {selectedBranch} =
    baseBranch && branches
      ? computeBranchSelection({baseBranch, branches, branch: branchFromProps})
      : {selectedBranch: undefined};
  const builds = buildData[1];
  const filteredBuilds = (builds || []).filter(build => build.branch === selectedBranch);
  const latestBuildById = _.maxBy(filteredBuilds, build => new Date(build.runAt).getTime());
  const buildIdToFetch =
    builds && selectedBranch ? (latestBuildById && latestBuildById.id) || '' : undefined;

  /** @type {[undefined, null]} */
  const shortCircuitArguments = [undefined, null];
  const realArguments = [projectData[1] && projectData[1].id, buildIdToFetch];

  const hasAllDataLoaded = Boolean(projectData[1] && buildData[1] && branchData[1]);
  const argumentsToUse =
    hasAllDataLoaded && !buildIdToFetch ? shortCircuitArguments : realArguments;
  return useBuildURLs(argumentsToUse[0], argumentsToUse[1]);
}

/** @param {{availableUrls: Array<{url: string}>, availableBranches: Array<{branch: string}>, selectedUrl: string, selectedBranch: string}} props */
const UrlAndBranchSelector = props => {
  return (
    <div className="dashboard__url-branch-selector">
      <Dropdown
        label="URL"
        className="dropdown--url"
        value={props.selectedUrl}
        setValue={url => {
          const to = new URL(window.location.href);
          to.searchParams.set('runUrl', url);
          route(`${to.pathname}${to.search}`);
        }}
        options={props.availableUrls.map(({url}) => ({value: url, label: url}))}
      />
      <Dropdown
        label="Branch"
        className="dropdown--branch"
        value={props.selectedBranch}
        setValue={branch => {
          const to = new URL(window.location.href);
          to.searchParams.set('branch', branch);
          route(`${to.pathname}${to.search}`);
        }}
        options={props.availableBranches.map(({branch}) => ({value: branch, label: branch}))}
      />
    </div>
  );
};

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>, availableUrls: Array<{url: string}>, availableBranches: Array<{branch: string}>, selectedUrl: string, selectedBranch: string}} props */
const ProjectDashboard_ = props => {
  const [isScrolledToGraphs, setIsScrolledToGraphs] = useState(false);

  useEffect(() => {
    const isScrolled = () => {
      const scrollDetector = document.getElementById('dashboard__scroll-height-detector');
      if (!(scrollDetector instanceof HTMLElement)) return false;
      return window.scrollY > scrollDetector.offsetTop;
    };
    const listener = () => setIsScrolledToGraphs(isScrolled());

    listener();
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  }, [setIsScrolledToGraphs]);

  return (
    <div
      className={clsx('dashboard', {
        'dashboard--scrolled': isScrolledToGraphs,
      })}
    >
      <DocumentTitle title={`${props.project.name} Dashboard`} />
      <ProjectBuildList project={props.project} builds={props.builds} />
      <div id="dashboard__scroll-height-detector" />
      <UrlAndBranchSelector {...props} />
      <ProjectCategorySummaries
        project={props.project}
        builds={props.builds}
        url={props.selectedUrl}
        branch={props.selectedBranch}
      />
    </div>
  );
};

/** @param {{projectSlug: string, runUrl?: string, branch?: string}} props */
export const ProjectDashboard = props => {
  const projectApiData = useProjectBySlug(props.projectSlug);
  const projectId = projectApiData[1] && projectApiData[1].id;
  const projectBuildData = useProjectBuilds(projectId);
  const projectBranchData = useProjectBranches(projectId);
  const projectUrlData = useUrlsAvailableForBranch(
    projectApiData,
    projectBuildData,
    projectBranchData,
    props.branch
  );

  const loadingState = combineLoadingStates(
    projectApiData,
    projectBuildData,
    projectUrlData,
    projectBranchData
  );

  const asyncData = combineAsyncData(
    projectApiData,
    projectBuildData,
    projectUrlData,
    projectBranchData
  );

  return (
    <Page>
      <AsyncLoader
        loadingState={loadingState}
        asyncData={asyncData}
        render={([project, builds, urls, branches]) =>
          builds.length ? (
            <ProjectDashboard_
              project={project}
              builds={builds}
              {...computeBranchSelection({
                baseBranch: project.baseBranch,
                branches,
                branch: props.branch,
              })}
              {...computeUrlSelection({
                urls,
                runUrl: props.runUrl,
              })}
            />
          ) : (
            <ProjectGettingStarted project={project} />
          )
        }
      />
    </Page>
  );
};
