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
  useProjectURLs,
  useProjectBranches,
} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Page} from '../../layout/page.jsx';
import {ProjectCategorySummaries} from './project-category-summaries.jsx';

import './project-dashboard.css';
import {Dropdown} from '../../components/dropdown';
import clsx from 'clsx';
import {ProjectBuildList} from './build-list';
import {ProjectGettingStarted} from '../project-dashboard/getting-started';

/** @param {{urls: Array<{url: string}>, branches: Array<{branch: string}>, runUrl?: string, branch?: string}} props */
const computeUrlAndBranchSelection = props => {
  const availableUrls = props.urls.length ? props.urls : [{url: 'None'}];
  const availableBranches = props.branches.length ? props.branches : [{branch: 'master'}];
  const selectedUrl = props.runUrl || availableUrls[0].url;
  const selectedBranch =
    props.branch ||
    (availableBranches.some(b => b.branch === 'master') ? 'master' : availableBranches[0].branch);
  return {
    availableUrls,
    availableBranches,
    selectedUrl,
    selectedBranch,
  };
};

/** @param {{availableUrls: Array<{url: string}>, availableBranches: Array<{branch: string}>, selectedUrl: string, selectedBranch: string}} props */
const UrlAndBranchSelector = props => {
  return (
    <div className="dashboard-redesign__url-branch-selector">
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
      const scrollDetector = document.getElementById('dashboard-redesign__scroll-height-detector');
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
      className={clsx('dashboard-redesign', {
        'dashboard-redesign--scrolled': isScrolledToGraphs,
      })}
    >
      <ProjectBuildList project={props.project} builds={props.builds} />
      <div id="dashboard-redesign__scroll-height-detector" />
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
  const projectUrlData = useProjectURLs(projectId);
  const projectBranchData = useProjectBranches(projectId);

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
              {...computeUrlAndBranchSelection({
                urls,
                branches,
                runUrl: props.runUrl,
                branch: props.branch,
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
