/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useState} from 'preact/hooks';
import '../../../server/src/ui/app.css';
import './app.css';
import {LandingRoute} from './routes/landing/landing.jsx';
import {ComparisonRoute} from './routes/comparison/comparison';

/**
 * @typedef {{filename: string, data: string, lhr: LH.Result}} ReportData
 */

export const App = () => {
  const [baseReport, setBaseReport] = useState(/** @type {ReportData|undefined} */ ({}));
  const [compareReport, setCompareReport] = useState(/** @type {ReportData|undefined} */ ({}));

  return (
    <div className="lhci">
      {baseReport && compareReport ? (
        <ComparisonRoute
          baseReport={baseReport}
          setBaseReport={setBaseReport}
          compareReport={compareReport}
          setCompareReport={setCompareReport}
        />
      ) : (
        <LandingRoute
          baseReport={baseReport}
          setBaseReport={setBaseReport}
          compareReport={compareReport}
          setCompareReport={setCompareReport}
        />
      )}
    </div>
  );
};
