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
} from '../../hooks/use-api-data';
import {BuildHashSelector} from './build-hash-selector';
import {BuildSelectorHeaderSection} from './build-selector-header-section';
import {Page} from '../../layout/page';

import {BuildViewWarnings, computeWarnings} from './build-view-warnings';
import {DocumentTitle} from '../../components/document-title';
import {LoadingSpinner} from '../../components/loading-spinner';
import {LhrComparison} from './lhr-comparison.jsx';
import {Dropdown} from '../../components/dropdown';

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

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, runs: Array<LHCI.ServerCommand.Run>, compareUrl?: string, hasBaseOverride: boolean}} props */
const BuildView_ = props => {
  const [openBuildHash, setOpenBuild] = useState(/** @type {null|'base'|'compare'} */ (null));
  const [isOpenLhrLinkHovered, setLhrLinkHover] = useState(false);
  const buildHashSelectorCloseFn = useCallback(() => setOpenBuild(null), [setOpenBuild]);

  const compareRuns = props.runs.filter(run => run.buildId === props.build.id);
  const selectedUrl = computeSelectedUrl(props, compareRuns);
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

  const definedLhr = lhr;
  const warningProps = {
    lhr: definedLhr,
    build: props.build,
    baseBuild: props.ancestorBuild,
    baseLhr: baseLhr,
    hasBaseOverride: props.hasBaseOverride,
  };

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
      <LhrComparison
        lhr={lhr}
        baseLhr={baseLhr}
        className={clsx({'build-view--with-lhr-link-hover': isOpenLhrLinkHovered})}
        hookElements={{
          warnings: computeWarnings(warningProps).hasWarning ? (
            <BuildViewWarnings {...warningProps} />
          ) : (
            undefined
          ),
          dropdowns: (
            <Dropdown
              label="URL"
              className="dropdown--url"
              value={selectedUrl}
              setValue={url => {
                const to = new URL(window.location.href);
                to.searchParams.set('compareUrl', url);
                route(`${to.pathname}${to.search}`);
              }}
              options={availableUrls.map(url => ({value: url, label: url}))}
            />
          ),
        }}
      />
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
