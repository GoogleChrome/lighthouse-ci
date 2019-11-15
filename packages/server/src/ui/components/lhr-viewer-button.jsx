/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {LhrViewerLink} from './lhr-viewer-link';
import './lhr-viewer-button.css';

// @ts-ignore - ts doesn't know how parcel works :)
const LH_ICON_PATH = require('../favicon.svg');

/** @param {{lhr: LH.Result}} props */
export const LhrViewerButton = props => {
  const {lhr} = props;
  return (
    <LhrViewerLink lhr={lhr}>
      <div className="lhr-viewer-button" role="button">
        <img src={LH_ICON_PATH} /> <span>Open Report</span>
      </div>
    </LhrViewerLink>
  );
};
