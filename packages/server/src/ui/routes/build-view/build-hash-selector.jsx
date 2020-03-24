/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import clsx from 'clsx';
import * as _ from '@lhci/utils/src/lodash.js';
import './build-hash-selector.css';
import {useBranchBuilds} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Pill} from '../../components/pill';
import {useEffect} from 'preact/hooks';

/** @param {{branch: string, withDevLine: boolean, withNode: boolean, withDevBranchArc: boolean, baseBranch: string}} props */
const GitViz = props => {
  const {branch, withDevLine, withNode, withDevBranchArc} = props;

  return (
    <span className="build-hash-selector__git-viz git-viz">
      <span className="git-viz__master-line" />
      {withDevLine ? <span className="git-viz__dev-line" /> : <Fragment />}
      {withNode && branch === props.baseBranch ? (
        <span className="git-viz__master-node" />
      ) : (
        <Fragment />
      )}
      {withNode && branch !== props.baseBranch ? (
        <span className="git-viz__dev-node" />
      ) : (
        <Fragment />
      )}
      {withDevBranchArc ? <span className="git-viz__dev-branch-off" /> : <Fragment />}
    </span>
  );
};

/** @param {{branch: string, withDevLine: boolean, withDevBranchArc?: boolean, baseBranch: string}} props */
const LabelLineItem = props => {
  const variant = props.branch === props.baseBranch ? 'master-branch' : 'dev-branch';
  return (
    <li className="build-hash-selector__item build-hash-selector__label-li">
      <div className="container">
        <span className="build-hash-selector__selection" />
        <GitViz
          baseBranch={props.baseBranch}
          branch={props.branch}
          withNode={false}
          withDevBranchArc={props.withDevBranchArc || false}
          withDevLine={props.withDevLine}
        />
        <span
          className={`build-hash-selector__branch-label build-hash-selector__branch-label--${variant}`}
        >
          {props.branch}
        </span>
      </div>
    </li>
  );
};

/** @param {{build: LHCI.ServerCommand.Build}} props */
const BuildLink = props => {
  return props.build.externalBuildUrl ? (
    <a href={props.build.externalBuildUrl} target="_blank" rel="noopener noreferrer">
      View Build
    </a>
  ) : (
    <Fragment />
  );
};

/** @param {{build: LHCI.ServerCommand.Build}} props */
const GitHubLink = props => {
  try {
    const externalBuildUrl = new URL(props.build.externalBuildUrl);
    if (!externalBuildUrl.host.includes('travis-ci')) return <Fragment />;
    const [org, repo] = externalBuildUrl.pathname.split('/').filter(Boolean);
    return (
      <a
        href={`https://github.com/${org}/${repo}/commit/${props.build.hash}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    );
  } catch (err) {
    return <Fragment />;
  }
};

/** @param {{build: LHCI.ServerCommand.Build, compareBuild: LHCI.ServerCommand.Build, baseBuild: LHCI.ServerCommand.Build | null | undefined, selector: 'base'|'compare', withDevBranchArc: boolean, withDevLine: boolean, key: string, baseBranch: string}} props */
const BuildLineItem = props => {
  const {build, compareBuild, baseBuild, selector} = props;
  const isCompareBranch = build.id === compareBuild.id;
  const isBaseBranch = build.id === (baseBuild && baseBuild.id);
  const isSelected =
    (selector === 'base' && isBaseBranch) || (selector === 'compare' && isCompareBranch);
  const variant = build.branch === props.baseBranch ? 'master-branch' : 'dev-branch';

  return (
    <li
      className={clsx('build-hash-selector__item', {
        'build-hash-selector__item--selected': isSelected,
      })}
      key={build.id}
      onClick={() => {
        if (isCompareBranch && selector === 'compare') return;
        if (isBaseBranch && selector === 'base') return;

        const url = new URL(window.location.href);

        if (selector === 'base') {
          url.searchParams.set('baseBuild', build.id);
        } else {
          url.searchParams.delete('baseBuild');
          if (baseBuild) url.searchParams.set('baseBuild', baseBuild.id);
          url.pathname = url.pathname.replace(/compare\/\w+$/, `compare/${_.shortId(build.id)}`);
        }

        window.location.href = url.href;
      }}
    >
      <div className="container">
        <span className="build-hash-selector__selection">
          {isCompareBranch && selector === 'base' && (
            <Pill variant="compare" solid>
              compare
            </Pill>
          )}
          {isBaseBranch && selector === 'compare' && (
            <Pill variant="base" solid>
              base
            </Pill>
          )}
        </span>
        <GitViz
          baseBranch={props.baseBranch}
          branch={build.branch}
          withNode
          withDevBranchArc={props.withDevBranchArc}
          withDevLine={props.withDevLine}
        />
        <Pill variant={variant} avatar={build}>
          <span className="build-hash-selector__hash">{build.hash.slice(0, 7)}</span>
        </Pill>{' '}
        <span className="build-hash-selector__commit">{build.commitMessage}</span>
        <span className="build-hash-selector__links">
          <BuildLink build={build} />
          <GitHubLink build={build} />
        </span>
      </div>
      {isSelected ? (
        <i className="material-icons build-hash-selector__selector-selection">check</i>
      ) : (
        <Fragment />
      )}
    </li>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', branchBuilds: Array<LHCI.ServerCommand.Build>, baseBuilds: Array<LHCI.ServerCommand.Build>, lhr: LH.Result, baseLhr?: LH.Result, close: () => void, baseBranch: string}} props
 */
export const BuildHashSelector_ = props => {
  const {branchBuilds, baseBuilds, baseBranch} = props;
  // Builds sorted by run time *descending* because we show most recent at the top.
  const builds = _.uniqBy(
    branchBuilds
      .concat(baseBuilds)
      .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime()),
    build => build.id
  );

  // Compute the index of the *lowest* dev build so we know when to show the branch arc
  const indexOfLastDev =
    props.build.branch === baseBranch
      ? -10
      : builds.length -
        1 -
        builds
          .slice()
          .reverse()
          .findIndex(build => build.branch === props.build.branch);

  useEffect(() => {
    /** @param {MouseEvent} evt */
    const listener = evt => {
      const target = evt.target;
      if (!(target instanceof HTMLElement)) return;
      // Click was within the BuildHashSelector, don't close it.
      if (target.closest('.build-hash-selector')) return;
      // Click was on a BuildSelectorHeaderSection, don't close it.
      if (target.closest('.build-selector-header-section')) return;
      // Click was outside our target area, close it.
      props.close();
    };

    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [props.close]);

  return (
    <ul className={`build-hash-selector__list build-hash-selector--${props.selector}`}>
      {builds.map((build, index) => (
        <Fragment key={build.id}>
          <BuildLineItem
            key={build.id}
            build={build}
            compareBuild={props.build}
            baseBuild={props.ancestorBuild}
            baseBranch={props.baseBranch}
            selector={props.selector}
            withDevLine={index <= indexOfLastDev && props.build.branch !== baseBranch}
            withDevBranchArc={index === indexOfLastDev + 1}
          />
          {index === indexOfLastDev && build.branch !== baseBranch ? (
            <LabelLineItem branch={build.branch} withDevLine={true} baseBranch={baseBranch} />
          ) : null}
          {indexOfLastDev === builds.length - 1 && index === indexOfLastDev ? (
            <LabelLineItem
              branch=""
              withDevLine={false}
              withDevBranchArc={true}
              baseBranch={baseBranch}
            />
          ) : null}
          {index === builds.length - 1 ? (
            <LabelLineItem branch={baseBranch} withDevLine={false} baseBranch={baseBranch} />
          ) : null}
        </Fragment>
      ))}
    </ul>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', lhr: LH.Result, baseLhr?: LH.Result, close: () => void, baseBranch: string}} props
 */
export const BuildHashSelector = props => {
  const {build, baseBranch} = props;
  const branchLoadingData = useBranchBuilds(build.projectId, build.branch, {limit: 100});
  const baseLoadingData = useBranchBuilds(build.projectId, baseBranch, {limit: 100});

  return (
    <Fragment>
      <div className="build-hash-selector-obscure-background" />
      <div className="build-hash-selector">
        <AsyncLoader
          loadingState={combineLoadingStates(branchLoadingData, baseLoadingData)}
          asyncData={combineAsyncData(branchLoadingData, baseLoadingData)}
          render={([branchBuilds, baseBuilds]) => (
            <BuildHashSelector_
              {...props}
              branchBuilds={branchBuilds}
              baseBuilds={baseBuilds}
              baseBranch={baseBranch}
            />
          )}
        />
      </div>
    </Fragment>
  );
};
