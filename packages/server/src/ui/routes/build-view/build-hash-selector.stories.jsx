/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {action} from '@storybook/addon-actions';
import {BuildHashSelector_} from './build-hash-selector';
import lhr_ from '../../../../test/fixtures/lh-5-6-0-verge-a.json';

export default {
  title: 'Build View/Build Hash Selector',
  component: BuildHashSelector_,
  parameters: {dimensions: {width: 800, height: 400}},
};

const lhr = /** @type {LH.Result} */ (lhr_);

const hash = (variant = 0) => 'abcdef1234567890'.repeat(1).slice(variant);

const runAt = (deltaInDays = 0) =>
  new Date(
    new Date('2019-10-01T22:32:09.191Z').getTime() + deltaInDays * 24 * 60 * 60 * 1000
  ).toISOString();

/** @param {number} id @return {LHCI.ServerCommand.Build} */
const build = id => ({
  id: id.toString(),
  projectId: '',
  externalBuildUrl: '',
  avatarUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  lifecycle: 'sealed',
  hash: hash(id),
  branch: 'master',
  runAt: runAt(id),
});

const masterBuilds = [build(0), build(2), build(5), build(10)];

const branchBuilds = [
  {...build(1), branch: 'dev'},
  {...build(3), branch: 'dev'},
  {...build(8), branch: 'dev'},
];

/** @param {{children: LHCI.PreactNode}} props */
const Wrapper = ({children}) => <div className="build-hash-selector">{children}</div>;

const defaultProps = {
  baseBuilds: masterBuilds,
  branchBuilds: branchBuilds,
  build: branchBuilds[0],
  ancestorBuild: masterBuilds[1],
  selector: /** @type {'base'} */ ('base'),
  lhr: lhr,
  close: action('close'),
};

export const SelectBase = () => (
  <Wrapper>
    <BuildHashSelector_ {...defaultProps} selector="base" baseBranch="master" />
  </Wrapper>
);

export const SelectCompare = () => (
  <Wrapper>
    <BuildHashSelector_ {...defaultProps} selector="compare" baseBranch="master" />
  </Wrapper>
);

export const CustomBaseBranch = () => (
  <Wrapper>
    <BuildHashSelector_
      {...defaultProps}
      selector="base"
      baseBranch="dev"
      baseBuilds={branchBuilds}
      branchBuilds={masterBuilds}
      build={masterBuilds[0]}
      ancestorBuild={branchBuilds[0]}
    />
  </Wrapper>
);

export const NoMasterBuilds = () => (
  <Wrapper>
    <BuildHashSelector_ {...defaultProps} selector="compare" baseBuilds={[]} baseBranch="master" />
  </Wrapper>
);

export const NoBranchBuilds = () => (
  <Wrapper>
    <BuildHashSelector_
      {...defaultProps}
      selector="base"
      build={masterBuilds[2]}
      branchBuilds={[]}
      baseBranch="master"
    />
  </Wrapper>
);
