/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './comparison.css';
import {LH_LOGO_PATH} from '../../components/lhci-components.jsx';
import {ReportUploadBox, computeBestDisplayType} from '../../components/report-upload-box';
import {LhrComparison} from '../../../../../server/src/ui/routes/build-view/lhr-comparison';

/** @typedef {import('../../app.jsx').ToastMessage} ToastMessage */
/** @typedef {import('../../app.jsx').ReportData} ReportData */

/** @param {{baseReport: ReportData, compareReport: ReportData, setBaseReport: (d: ReportData|undefined) => void, setCompareReport: (d: ReportData|undefined) => void, addToast: (t: ToastMessage) => void}} props */
export const ComparisonRoute = props => {
  const displayType = computeBestDisplayType(props.baseReport.lhr, props.compareReport.lhr);
  return (
    <div className="comparison">
      <div className="comparison-header">
        <div
          className="comparison-header__switcher"
          onClick={() => {
            props.setBaseReport(props.compareReport);
            props.setCompareReport(props.baseReport);
          }}
        >
          <i className="material-icons">swap_horiz</i>
        </div>
        <div className="comparison-header__logo">
          <img
            src={LH_LOGO_PATH}
            alt="Lighthouse Logo"
            onClick={() => {
              props.setBaseReport(undefined);
              props.setCompareReport(undefined);
            }}
          />
        </div>
        <div className="comparison-header__upload">
          <ReportUploadBox
            variant="base"
            dragTarget="self"
            report={props.baseReport}
            setReport={props.setBaseReport}
            addToast={props.addToast}
            displayType={displayType}
            showOpenLhrLink
          />
          <ReportUploadBox
            variant="compare"
            dragTarget="self"
            report={props.compareReport}
            setReport={props.setCompareReport}
            addToast={props.addToast}
            displayType={displayType}
            showOpenLhrLink
          />
        </div>
        <a className="comparison-header__info" href="https://github.com/GoogleChrome/lighthouse-ci">
          <i className="material-icons">info</i>
        </a>
      </div>
      <div className="comparison-body">
        <LhrComparison
          lhr={props.compareReport.lhr}
          baseLhr={props.baseReport.lhr}
          hookElements={{}}
        />
      </div>
    </div>
  );
};
