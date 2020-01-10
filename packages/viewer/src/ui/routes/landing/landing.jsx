/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './landing.css';
import {CONFETTI_PATH, LH_LOGO_PATH, Paper} from '../../components/lhci-components.jsx';
import {ReportUploadBox} from '../../components/report-upload-box';

/** @typedef {import('../../app.jsx').ToastMessage} ToastMessage */
/** @typedef {import('../../app.jsx').ReportData} ReportData */

/** @param {{baseReport?: ReportData, compareReport?: ReportData, setBaseReport: (d: ReportData) => void, setCompareReport: (d: ReportData) => void, addToast: (t: ToastMessage) => void}} props */
export const LandingRoute = props => {
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
          rel="noopener noreferrer"
        >
          <i className="material-icons">info</i>
        </a>
        <img className="landing__logo" src={LH_LOGO_PATH} alt="Lighthouse Logo" />
        <h1>Lighthouse CI Diff</h1>
        <span>Drag or upload two Lighthouse reports to start comparing!</span>
        <div className="landing__upload">
          <ReportUploadBox
            variant="base"
            report={props.baseReport}
            setReport={props.setBaseReport}
            addToast={props.addToast}
            displayType="filename"
            dragTarget={props.baseReport ? 'self' : 'document'}
          />
          <ReportUploadBox
            variant="compare"
            report={props.compareReport}
            setReport={props.setCompareReport}
            addToast={props.addToast}
            displayType="filename"
            dragTarget={props.baseReport ? 'document' : 'self'}
          />
        </div>
      </Paper>
    </div>
  );
};
