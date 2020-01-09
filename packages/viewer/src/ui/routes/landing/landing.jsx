/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './landing.css';
import {CONFETTI_PATH, LH_LOGO_PATH, Paper} from '../../components';

/** @param {{variant: 'base'|'compare'}} props */
const ReportUploadBox = props => {
  return (
    <div className={`report-upload-box report-upload-box--${props.variant}`}>
      <span className="report-upload-box__label">
        {props.variant === 'base' ? 'Base' : 'Compare'}
      </span>
      <div className="report-upload-box__file">
        <span>www.google-2020-01-05T12:32:12Z.json</span>
      </div>
      <span className="report-upload-box__upload">Upload</span>
    </div>
  );
};

export const LandingRoute = () => {
  return (
    <div className="landing">
      <div className="landing__background">
        <img src={CONFETTI_PATH} alt="Lighthouse CI Background Image" />
      </div>
      <Paper className="landing__paper">
        <a
          className="landing__info-icon"
          href="https://github.com/GoogleChrome/lighthouse-ci"
          target="_blank"
          rel="noopener"
        >
          <i className="material-icons">info</i>
        </a>
        <img className="landing__logo" src={LH_LOGO_PATH} alt="Lighthouse Logo" />
        <h1>Lighthouse CI Diff</h1>
        <span>Upload two Lighthouse reports to start comparing...</span>
        <div className="landing__upload">
          <ReportUploadBox variant="base" />
          <ReportUploadBox variant="compare" />
        </div>
      </Paper>
    </div>
  );
};
