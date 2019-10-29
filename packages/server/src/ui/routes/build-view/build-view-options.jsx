/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './build-view-options.css';
import {LhrViewerLink} from '../../components/lhr-viewer-link';

// @ts-ignore
const LOGO_SVG_URL = require('../../logo.svg');

/** @param {{compareLhr: LH.Result, baseLhr?: LH.Result}} props */
export const BuildViewOptions = props => {
  return (
    <div className="build-view__options">
      {props.baseLhr ? (
        <LhrViewerLink lhr={props.baseLhr} className="build-view-options__report-link">
          <div data-tooltip="Open Base Report">
            <img src={LOGO_SVG_URL} alt="Open Base Report" />
          </div>
        </LhrViewerLink>
      ) : null}
      <LhrViewerLink lhr={props.compareLhr} className="build-view-options__report-link">
        <div data-tooltip="Open Compare Report">
          <img src={LOGO_SVG_URL} alt="Open Compare Report" />
        </div>
      </LhrViewerLink>
    </div>
  );
};
