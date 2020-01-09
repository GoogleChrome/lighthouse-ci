/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {Paper} from '../../components/paper';
import {LhrViewerLink} from '../../components/lhr-viewer-link';

/** @param {{build: LHCI.ServerCommand.Build, baseBuild: LHCI.ServerCommand.Build | null, lhr: LH.Result, baseLhr?: LH.Result, hasBaseOverride: boolean}} props */
export function computeWarnings(props) {
  const {build, baseBuild, baseLhr, hasBaseOverride} = props;
  const missingBase = !baseBuild;
  const missingBaseLhr = !baseLhr;
  const baseAndCompareAreSame = baseBuild && build.hash === baseBuild.hash;
  const missingAncestor = baseBuild && baseBuild.hash !== build.ancestorHash && !hasBaseOverride;
  return {
    hasWarning: missingBase || missingBaseLhr || baseAndCompareAreSame || missingAncestor,
    missingBase,
    missingBaseLhr,
    baseAndCompareAreSame,
    missingAncestor,
  };
}

/** @param {{build: LHCI.ServerCommand.Build, baseBuild: LHCI.ServerCommand.Build | null, lhr: LH.Result, baseLhr?: LH.Result, hasBaseOverride: boolean}} props */
export const BuildViewWarnings = props => {
  const warnings = computeWarnings(props);

  const lhrLinkEl = (
    <Fragment>
      <LhrViewerLink className="lhr-comparison__warning__lhr-link" lhr={props.lhr}>
        jump straight to the Lighthouse report.
      </LhrViewerLink>
    </Fragment>
  );

  if (warnings.missingBase) {
    return (
      <Paper className="lhr-comparison__warning">
        <i className="material-icons">sentiment_very_dissatisfied</i>
        <div>
          Oops, no base build could be found for this commit. Manually select a base build above, or{' '}
          {lhrLinkEl}
        </div>
      </Paper>
    );
  }

  if (warnings.baseAndCompareAreSame) {
    return (
      <Paper className="lhr-comparison__warning">
        <i className="material-icons">sentiment_very_dissatisfied</i>
        <div>
          Oops, this base build is the same commit as the compare. Select a different base build to
          explore differences, or {lhrLinkEl}
        </div>
      </Paper>
    );
  }

  if (warnings.missingBaseLhr) {
    return (
      <Paper className="lhr-comparison__warning">
        <i className="material-icons">sentiment_very_dissatisfied</i>
        <div>
          Oops, this base build is missing a run for this URL. Select a different URL to explore
          differences, or {lhrLinkEl}
        </div>
      </Paper>
    );
  }

  if (warnings.missingAncestor) {
    return (
      <Paper className="lhr-comparison__warning">
        <i className="material-icons">warning</i>
        <div>
          This base build is not the exact ancestor of the compare. Differences may not be due to
          this specific commit.
        </div>
      </Paper>
    );
  }

  return <Fragment />;
};
