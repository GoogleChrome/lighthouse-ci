/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as _ from '@lhci/utils/src/lodash.js';
import './build-hash-selector.css';
import {useBranchBuilds} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Pill} from '../../components/pill';
import {LhrViewerLink} from '../../components/lhr-viewer-link';

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', branchBuilds: Array<LHCI.ServerCommand.Build>, baseBuilds: Array<LHCI.ServerCommand.Build>, lhr: LH.Result, baseLhr?: LH.Result}} props
 */
const BuildHashSelector_ = props => {
  const {branchBuilds, baseBuilds, ancestorBuild} = props;
  const builds = _.uniqBy(
    branchBuilds
      .concat(baseBuilds)
      .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime()),
    build => build.id
  );

  return (
    <div className="container">
      <ul className="build-hash-selector__list">
        {builds.map(build => {
          const isCompareBranch = build.id === props.build.id;
          const isBaseBranch = build.id === (ancestorBuild && ancestorBuild.id);
          const variant = build.branch === props.build.branch ? 'dev-branch' : 'master-branch';

          return (
            <li key={build.id}>
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
              <Pill
                variant={variant}
                onClick={() => {
                  if (isCompareBranch && props.selector === 'compare') return;
                  if (isBaseBranch && props.selector === 'base') return;

                  const url = new URL(window.location.href);

                  if (props.selector === 'base') {
                    url.searchParams.set('baseHash', build.hash);
                  } else {
                    url.searchParams.delete('baseHash');
                    if (ancestorBuild) url.searchParams.set('baseHash', ancestorBuild.hash);
                    url.pathname = url.pathname.replace(props.build.id, build.id);
                  }

                  window.location.href = url.href;
                }}
              >
                <span className="build-hash-selector__hash">{build.hash.slice(0, 8)}</span>
              </Pill>{' '}
              <img className="build-hash-selector__avatar" src={build.avatarUrl} />
              <span className="build-hash-selector__commit">{build.commitMessage}</span>
              <span className="build-hash-selector__links">
                {isCompareBranch && (
                  <a href="#">
                    <LhrViewerLink lhr={props.lhr}>Report</LhrViewerLink>
                  </a>
                )}
                {!isCompareBranch && isBaseBranch && props.baseLhr && (
                  <a href="#">
                    <LhrViewerLink lhr={props.baseLhr}>Report</LhrViewerLink>
                  </a>
                )}
                <a href={build.externalBuildUrl}>Travis</a>
                <a href={build.externalBuildUrl}>GH</a>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare', lhr: LH.Result, baseLhr?: LH.Result}} props
 */
export const BuildHashSelector = props => {
  const branchLoadingData = useBranchBuilds(props.build.projectId, props.build.branch);
  const baseLoadingData = useBranchBuilds(props.build.projectId, 'master');
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
