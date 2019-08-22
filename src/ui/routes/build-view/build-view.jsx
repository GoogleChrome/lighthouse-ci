/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useMemo} from 'preact/hooks';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Dropdown} from '../../components/dropdown';
import {
  useProject,
  useBuild,
  useOptionalAncestorBuild,
  useBuildURLs,
  useOptionalBuildRepresentativeRuns,
} from '../../hooks/use-api-data';
import {BuildSelectorPill} from './build-selector-pill';
import {Page} from '../../layout/page';
import {BuildScoreComparison} from './build-score-comparison';

import './build-view.css';
import {BuildViewLegend} from './build-view-legend';

/** @param {{selectedUrl: string, setUrl(url: string): void, build: LHCI.ServerCommand.Build | null, lhr?: LH.Result, baseLhr?: LH.Result, urls: Array<{url: string}>}} props */
const BuildViewScoreAndUrl = props => {
  return (
    <div className="build-view__scores-and-url">
      <div className="container">
        <Dropdown
          className="build-view__url-dropdown"
          value={props.selectedUrl}
          setValue={props.setUrl}
          options={props.urls.map(({url}) => ({value: url, label: url}))}
        />
        <BuildScoreComparison {...props} />
      </div>
    </div>
  );
};

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, buildUrls: Array<{url: string}>, runs: Array<LHCI.ServerCommand.Run>}} props */
const BuildView_ = props => {
  const [selectedUrlState, setUrl] = useState('');
  const selectedUrl = selectedUrlState || (props.runs[0] && props.runs[0].url);

  const ancestorBuildId = props.ancestorBuild && props.ancestorBuild.id;
  const run = props.runs.find(run => run.buildId === props.build.id);
  const baseRun = props.runs.find(run => run.buildId === ancestorBuildId);

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

  if (!run) {
    return (
      <Fragment>
        <h1>No runs for build</h1>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </Fragment>
    );
  }

  return (
    <Page
      header={
        <Fragment>
          <BuildSelectorPill build={props.ancestorBuild} variant="base" />
          <BuildSelectorPill build={props.build} variant="compare" />
        </Fragment>
      }
    >
      <span>{lhrError && <h1>Error parsing LHR ({lhrError.stack})</h1>}</span>
      <BuildViewScoreAndUrl
        build={props.build}
        lhr={lhr}
        baseLhr={baseLhr}
        selectedUrl={selectedUrl}
        setUrl={setUrl}
        urls={props.buildUrls}
      />
      <div className="container">
        <BuildViewLegend />
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </Page>
  );
};

/** @param {{projectId: string, buildId: string, baseHash?: string}} props */
export const BuildView = props => {
  const projectLoadingData = useProject(props.projectId);
  const buildLoadingData = useBuild(props.projectId, props.buildId);
  const buildUrlsData = useBuildURLs(props.projectId, props.buildId);

  const ancestorHashOptions = props.baseHash ? {ancestorHash: props.baseHash} : buildLoadingData[1];
  const ancestorBuildData = useOptionalAncestorBuild(props.projectId, ancestorHashOptions);
  const ancestorBuildId = ancestorBuildData[1] && ancestorBuildData[1].id;

  const runData = useOptionalBuildRepresentativeRuns(props.projectId, props.buildId, null);

  const baseRunData = useOptionalBuildRepresentativeRuns(
    props.projectId,
    ancestorBuildId === null ? 'EMPTY_QUERY' : ancestorBuildId,
    null
  );

  return (
    <AsyncLoader
      loadingState={combineLoadingStates(
        projectLoadingData,
        buildLoadingData,
        ancestorBuildData,
        buildUrlsData,
        runData,
        baseRunData
      )}
      asyncData={combineAsyncData(
        projectLoadingData,
        buildLoadingData,
        ancestorBuildData,
        buildUrlsData,
        runData,
        baseRunData
      )}
      renderLoading={() => (
        <Page>
          <h1>Loading...</h1>
        </Page>
      )}
      render={([project, build, ancestorBuild, buildUrls, runs, baseRuns]) => (
        <BuildView_
          project={project}
          build={build}
          ancestorBuild={ancestorBuild}
          buildUrls={buildUrls}
          runs={runs.concat(baseRuns)}
        />
      )}
    />
  );
};
