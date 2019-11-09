/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './build-selector-header-section.css';
import clsx from 'clsx';
import {Pill} from '../../components/pill';
import {LhrViewerButton} from '../../components/lhr-viewer-button';

/**
 *
 * @param {{build: LHCI.ServerCommand.Build, variant: 'base'|'compare'}} props
 */
const Selection = props => {
  const {hash, commitMessage = 'unknown commit'} = props.build;
  return (
    <Fragment>
      <Pill className="build-selector-header-section__hash" variant={props.variant} solid>
        {hash.slice(0, 8)}
      </Pill>
      <span className="build-selector-header-section__message">{commitMessage}</span>
    </Fragment>
  );
};

/**
 * @param {{build: LHCI.ServerCommand.Build | null, lhr?: LH.Result, variant: 'base'|'compare', isOpen?: boolean, isDimmed?: boolean, setLhrLinkHover: (v: boolean) => void, onClick?: () => void}} props
 */
export const BuildSelectorHeaderSection = props => {
  return (
    <div
      className={clsx(
        `build-selector-header-section build-selector-header-section--${props.variant}`,
        {
          'build-selector-header-section--open': props.isOpen,
          'build-selector-header-section--dim': props.isDimmed,
        }
      )}
      onClick={props.onClick}
    >
      {props.build ? (
        <Selection build={props.build} variant={props.variant} />
      ) : (
        <span className="build-selector-header-section__message">None</span>
      )}
      <div
        className="build-selector-header-section__lhr-link"
        onMouseEnter={() => props.setLhrLinkHover(true)}
        onMouseLeave={() => props.setLhrLinkHover(false)}
      >
        {props.lhr ? <LhrViewerButton lhr={props.lhr} /> : <Fragment />}
      </div>
      <div className="build-selector-header-section__variant-label">{props.variant}</div>
    </div>
  );
};
