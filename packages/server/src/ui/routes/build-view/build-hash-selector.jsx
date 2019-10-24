/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import * as _ from '@lhci/utils/src/lodash.js';
import './build-hash-selector.css';
import {useBranchBuilds} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Pill} from '../../components/pill';
import {useEffect} from 'preact/hooks';

/** @param {{branch: string, withDevLine: boolean, withNode: boolean, withDevBranchArc: boolean}} props */
const GitViz = props => {
  const {branch, withDevLine, withNode, withDevBranchArc} = props;

  return (
    <span className="build-hash-selector__git-viz git-viz">
      <span className="git-viz__master-line" />
      {withDevLine ? <span className="git-viz__dev-line" /> : <Fragment />}
      {withNode && branch === 'master' ? <span className="git-viz__master-node" /> : <Fragment />}
      {withNode && branch !== 'master' ? <span className="git-viz__dev-node" /> : <Fragment />}
      {withDevBranchArc ? <span className="git-viz__dev-branch-off" /> : <Fragment />}
    </span>
  );
};

/** @param {{branch: string, withDevLine: boolean}} props */
const LabelLineItem = props => {
  const variant = props.branch === 'master' ? 'master-branch' : 'dev-branch';
  return (
    <li className="build-hash-selector__label-li">
      <span className="build-hash-selector__selection" />
      <GitViz
        branch={props.branch}
        withNode={false}
        withDevBranchArc={false}
        withDevLine={props.withDevLine}
      />
      <span
        className={`build-hash-selector__branch-label build-hash-selector__branch-label--${variant}`}
      >
        {props.branch}
      </span>
    </li>
  );
};

/** @param {{build: LHCI.ServerCommand.Build, compareBuild: LHCI.ServerCommand.Build, baseBuild: LHCI.ServerCommand.Build | null | undefined, selector: 'base'|'compare', withDevBranchArc: boolean, withDevLine: boolean, key: string}} props */
const BuildLineItem = props => {
  const {build, compareBuild, baseBuild, selector} = props;
  const isCompareBranch = build.id === compareBuild.id;
  const isBaseBranch = build.id === (baseBuild && baseBuild.id);
  const variant = build.branch === 'master' ? 'master-branch' : 'dev-branch';

  return (
    <li
      key={build.id}
      onClick={() => {
        if (isCompareBranch && selector === 'compare') return;
        if (isBaseBranch && selector === 'base') return;

        const url = new URL(window.location.href);

        if (selector === 'base') {
          url.searchParams.set('baseHash', build.hash);
        } else {
          url.searchParams.delete('baseHash');
          if (baseBuild) url.searchParams.set('baseHash', baseBuild.hash);
          url.pathname = url.pathname.replace(compareBuild.id, build.id);
        }

        window.location.href = url.href;
      }}
    >
      <span className="build-hash-selector__selection">
        {isCompareBranch && (
          <Pill variant="compare" solid>
            compare
          </Pill>
        )}
        {isBaseBranch && (
          <Pill variant="base" solid>
            base
          </Pill>
        )}
      </span>
      <GitViz
        branch={build.branch}
        withNode
        withDevBranchArc={props.withDevBranchArc}
        withDevLine={props.withDevLine}
      />
      <Pill variant={variant}>
        <span className="build-hash-selector__hash">{build.hash.slice(0, 8)}</span>
      </Pill>{' '}
      <img className="build-hash-selector__avatar" alt={build.author} src={build.avatarUrl} />
      <span className="build-hash-selector__commit">{build.commitMessage}</span>
      <span className="build-hash-selector__links">
        {build.externalBuildUrl ? <a href={build.externalBuildUrl}>View Build</a> : <Fragment />}
      </span>
    </li>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', branchBuilds: Array<LHCI.ServerCommand.Build>, baseBuilds: Array<LHCI.ServerCommand.Build>, lhr: LH.Result, baseLhr?: LH.Result, close: () => void}} props
 */
const BuildHashSelector_ = props => {
  const {branchBuilds, baseBuilds} = props;
  const builds = _.uniqBy(
    branchBuilds
      .concat(baseBuilds)
      .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime()),
    build => build.id
  );

  const indexOfFirstDev =
    builds.length -
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
      // Click was on a BuildSelectorPill, don't close it.
      if (target.closest('.build-selector-pill')) return;
      // Click was outside our target area, close it.
      props.close();
    };

    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [props.close]);

  return (
    <div className="container">
      <ul className={`build-hash-selector__list build-hash-selector--${props.selector}`}>
        {builds.map((build, index) => (
          <Fragment key={build.id}>
            <BuildLineItem
              key={build.id}
              build={build}
              compareBuild={props.build}
              baseBuild={props.ancestorBuild}
              selector={props.selector}
              withDevLine={index <= indexOfFirstDev && props.build.branch !== 'master'}
              withDevBranchArc={index === indexOfFirstDev + 1}
            />
            {index === indexOfFirstDev && build.branch !== 'master' ? (
              <LabelLineItem branch={build.branch} withDevLine={true} />
            ) : null}
            {index === builds.length - 1 ? (
              <LabelLineItem branch={build.branch} withDevLine={false} />
            ) : null}
          </Fragment>
        ))}
      </ul>
    </div>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', lhr: LH.Result, baseLhr?: LH.Result, close: () => void}} props
 */
export const BuildHashSelector = props => {
  const branchLoadingData = useBranchBuilds(props.build.projectId, props.build.branch, {limit: 10});
  const baseLoadingData = useBranchBuilds(props.build.projectId, 'master', {limit: 5});
  return (
    <div className="build-hash-selector">
      <AsyncLoader
        loadingState={combineLoadingStates(branchLoadingData, baseLoadingData)}
        asyncData={combineAsyncData(branchLoadingData, baseLoadingData)}
        render={([branchBuilds, baseBuilds]) => (
          <BuildHashSelector_ {...props} branchBuilds={branchBuilds} baseBuilds={baseBuilds} />
        )}
      />
    </div>
  );
};
