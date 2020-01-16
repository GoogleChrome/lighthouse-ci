/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useEffect, useCallback} from 'preact/hooks';
import '../../../server/src/ui/app.css';
import './app.css';
import {LandingRoute} from './routes/landing/landing.jsx';
import {ComparisonRoute} from './routes/comparison/comparison.jsx';
import {LoadingSpinner} from './components/lhci-components.jsx';
import {parseStringAsLhr} from './components/report-upload-box.jsx';
import {Toast} from './components/toast.jsx';

const SEARCH_PARAMS = new URLSearchParams(location.search);
const INITIAL_BASE_URL = SEARCH_PARAMS.get('baseReport');
const INITIAL_COMPARE_URL = SEARCH_PARAMS.get('compareReport');

/**
 * @typedef {{filename: string, data: string, lhr: LH.Result}} ReportData
 */
/**
 * @typedef {{message: string, level?: 'error' | 'info'}} ToastMessage
 */

/**
 * @param {string} url
 * @param {(r: ReportData) => void} setReport
 */
async function loadReportFromURL(url, setReport) {
  const filename = new URL(url).pathname.split('/').slice(-1)[0] || 'Unknown';
  const response = await fetch(url);
  const data = await response.text();
  const lhr = parseStringAsLhr(data);
  if (lhr instanceof Error) throw lhr;
  setReport({filename, data, lhr});
}

/**
 * @param {(r: ReportData) => void} setBaseReport
 * @param {(r: ReportData) => void} setCompareReport
 * @param {(b: boolean) => void} setIsLoading
 * @param {(t: ToastMessage) => void} addToast
 */
async function loadInitialReports(setBaseReport, setCompareReport, setIsLoading, addToast) {
  if (window.location.hostname === 'localhost') {
    const lastBaseReport = localStorage.getItem('lastBaseReport');
    const lastCompareReport = localStorage.getItem('lastCompareReport');
    if (lastBaseReport) setBaseReport(JSON.parse(lastBaseReport));
    if (lastCompareReport) setCompareReport(JSON.parse(lastCompareReport));
  }

  const promises = [
    INITIAL_BASE_URL && loadReportFromURL(INITIAL_BASE_URL, setBaseReport),
    INITIAL_COMPARE_URL && loadReportFromURL(INITIAL_COMPARE_URL, setCompareReport),
  ].filter(/** @return {p is Promise<void>} */ p => !!p);
  if (!promises.length) return;

  setIsLoading(true);
  await Promise.all(
    promises.map(p =>
      p.catch(err => {
        console.error(err); // eslint-disable-line no-console
        addToast({message: `Failed loading report from URL: ${err.message}`, level: 'error'});
      })
    )
  );
  setIsLoading(false);
}

export const App = () => {
  const initialReport = /** @type {ReportData|undefined} */ (undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [baseReport, setBaseReport] = useState(initialReport);
  const [compareReport, setCompareReport] = useState(initialReport);
  const [toasts, setToasts] = useState(/** @type {Array<ToastMessage>} */ ([]));
  /** @param {ToastMessage} toast */
  const addToastUnmemoized = toast => setToasts(toasts => [...toasts, toast]);
  const addToast = useCallback(addToastUnmemoized, [setToasts]);

  useEffect(() => {
    loadInitialReports(setBaseReport, setCompareReport, setIsLoading, addToast);
  }, []);

  useEffect(() => {
    localStorage.setItem('lastBaseReport', JSON.stringify(baseReport));
    localStorage.setItem('lastCompareReport', JSON.stringify(compareReport));
  }, [baseReport, compareReport]);

  return (
    <div className="lhci-viewer">
      {isLoading ? (
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      ) : (
        <Fragment />
      )}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.message} toast={toast} setToasts={setToasts} />
        ))}
      </div>
      {baseReport && compareReport ? (
        <ComparisonRoute
          baseReport={baseReport}
          setBaseReport={setBaseReport}
          compareReport={compareReport}
          setCompareReport={setCompareReport}
          addToast={addToast}
        />
      ) : (
        <LandingRoute
          baseReport={baseReport}
          setBaseReport={setBaseReport}
          compareReport={compareReport}
          setCompareReport={setCompareReport}
          addToast={addToast}
        />
      )}
    </div>
  );
};
