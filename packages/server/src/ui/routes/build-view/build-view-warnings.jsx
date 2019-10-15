/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {Paper} from '../../components/paper';

/** @param {{build: LHCI.ServerCommand.Build, baseBuild: LHCI.ServerCommand.Build | null, baseLhr?: LH.Result, hasBaseOverride: boolean}} props */
export const BuildViewWarnings = props => {
  const {build, baseBuild, baseLhr, hasBaseOverride} = props;
  /** @type {Array<string>} */
  const warningMessages = [];

  if (!baseBuild) {
    warningMessages.push('No base build could be found for this commit.');
  }

  if (baseBuild && build.hash === baseBuild.hash) {
    warningMessages.push(
      [
        'This base build is the same commit as the compare.',
        'Select a different base build to explore differences.',
      ].join(' ')
    );
  }

  if (baseBuild && !baseLhr) {
    warningMessages.push('This base build is missing a run for this URL.');
  }

  if (
    baseBuild &&
    baseBuild.hash !== build.ancestorHash &&
    !warningMessages.length &&
    !hasBaseOverride
  ) {
    warningMessages.push(
      [
        'This base build is not the target ancestor of the compare.',
        'Differences may not be due to this specific commit.',
      ].join(' ')
    );
  }

  return (
    <Fragment>
      {warningMessages.map(message => {
        return (
          <Paper className="build-view__warning" key={message}>
            <i className="material-icons">warning</i>
            <div>{message}</div>
          </Paper>
        );
      })}
    </Fragment>
  );
};
