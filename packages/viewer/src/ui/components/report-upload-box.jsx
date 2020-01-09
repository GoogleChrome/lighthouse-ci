/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './report-upload-box.css';

/** @typedef {import('../app.jsx').ToastMessage} ToastMessage */
/** @typedef {import('../app.jsx').ReportData} ReportData */

/** @param {string} s @return {LH.Result|Error} */
export function parseStringAsLhr(s) {
  if (s.trim().charAt(0) === '{') {
    try {
      const lhr = JSON.parse(s);
      if (lhr.lighthouseVersion) return lhr;
      return new Error(`JSON did not contain a lighthouseVersion`);
    } catch (err) {
      return err;
    }
  }

  return new Error('File was not valid JSON');
}

/** @param {{variant: 'base'|'compare', report: ReportData|undefined, setReport: (d: ReportData) => void, addToast: (t: ToastMessage) => void}} props */
export const ReportUploadBox = props => {
  return (
    <div className={`report-upload-box report-upload-box--${props.variant}`}>
      <span className="report-upload-box__label">
        {props.variant === 'base' ? 'Base' : 'Compare'}
      </span>
      <div className="report-upload-box__file">
        {props.report ? <span>{props.report.filename}</span> : <Fragment />}
      </div>
      <label className="report-upload-box__upload">
        Upload
        <input
          type="file"
          style={{display: 'none'}}
          onChange={e => {
            const input = e.target;
            if (!(input instanceof HTMLInputElement)) return;
            const files = input.files;
            if (!files || files.length !== 1) return;
            const filename = files[0].name;
            const reader = new FileReader();
            reader.readAsText(files[0], 'utf-8');
            reader.addEventListener('load', () => {
              if (typeof reader.result !== 'string') {
                props.addToast({message: 'File was not readable as text!', level: 'error'});
                return;
              }

              const lhr = parseStringAsLhr(reader.result);
              if (lhr instanceof Error) {
                props.addToast({message: `Invalid file: ${lhr.message}`, level: 'error'});
                return;
              }

              props.setReport({filename, data: reader.result, lhr});
            });
            reader.addEventListener('error', () => {
              props.addToast({message: 'File was not readable!', level: 'error'});
            });
          }}
        />
      </label>
    </div>
  );
};
