/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import './report-upload-box.css';
import {LhrViewerButton} from './lhci-components';
import {useState, useEffect, useRef} from 'preact/hooks';
import clsx from 'clsx';

/** @typedef {import('../app.jsx').ToastMessage} ToastMessage */
/** @typedef {import('../app.jsx').ReportData} ReportData */
/** @typedef {'filename'|'hostname'|'pathname'|'path'|'timestamp-hostname'|'timestamp-pathname'} DisplayType */
/** @typedef {{variant: 'base'|'compare', displayType: DisplayType, report: ReportData|undefined, setReport: (d: ReportData) => void, addToast: (t: ToastMessage) => void, showOpenLhrLink?: boolean, dragTarget?: 'self' | 'document'}} ReportUploadBoxProps */
/** @typedef {HTMLElement|undefined} DragData */

/** @param {string} s @return {LH.Result|Error} */
export function parseStringAsLhr(s) {
  if (s.includes('<script>window.__LIGHTHOUSE_JSON__ = ')) {
    const match = s.match(/window\.__LIGHTHOUSE_JSON__ = (.*?});<\/script>/);
    if (match) s = match[1];
  }

  if (s.trim().charAt(0) === '{') {
    try {
      const lhr = JSON.parse(s);
      if (lhr.lighthouseVersion) return lhr;
      return new Error(`JSON did not contain a lighthouseVersion`);
    } catch (err) {
      return new Error(`File was not valid JSON (${err.message})`);
    }
  }

  return new Error('File was not a valid report');
}

/** @param {LH.Result} lhrA  @param {LH.Result} lhrB @return {DisplayType} */
export function computeBestDisplayType(lhrA, lhrB) {
  const urlA = new URL(lhrA.finalUrl);
  const urlB = new URL(lhrB.finalUrl);
  if (urlA.hostname !== urlB.hostname) return 'hostname';
  if (urlA.pathname !== urlB.pathname) return 'pathname';
  if (urlA.search !== urlB.search) return 'path';
  if (urlA.pathname.length < 5) return 'timestamp-hostname';
  return 'timestamp-pathname';
}

/** @param {{report: ReportData, displayType: DisplayType}} props */
const FilePill = props => {
  const {filename, lhr} = props.report;
  const url = new URL(lhr.finalUrl);
  const timestamp = new Date(lhr.fetchTime).toLocaleString();
  const options = {
    filename,
    hostname: url.hostname,
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
    'timestamp-hostname': `${timestamp} (${url.hostname})`,
    'timestamp-pathname': `${timestamp} (${url.pathname})`,
  };

  const tooltip = `${url.href} at ${timestamp}`;
  return <span title={tooltip}>{options[props.displayType]}</span>;
};

/** @param {Pick<ReportUploadBoxProps, 'addToast'|'setReport'>} props @param {FileList} fileList */
function handleFileInput(props, fileList) {
  const filename = fileList[0].name;
  const reader = new FileReader();
  reader.readAsText(fileList[0], 'utf-8');

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
}

/** @param {ReportUploadBoxProps} props @param {import('preact/hooks').Ref<DragData>} dragTargetRef @param {(b: boolean) => void} setIsDragging @param {Event} e */
function handleDragEnter(props, dragTargetRef, setIsDragging, e) {
  if (!(e.target instanceof HTMLElement)) return;
  e.stopPropagation();
  e.preventDefault();
  setIsDragging(true);
  dragTargetRef.current = e.target;
}

/** @param {ReportUploadBoxProps} props @param {import('preact/hooks').Ref<DragData>} dragTargetRef @param {(b: boolean) => void} setIsDragging @param {Event} e */
function handleDragLeave(props, dragTargetRef, setIsDragging, e) {
  if (e.target !== dragTargetRef.current) return;
  e.stopPropagation();
  e.preventDefault();
  setIsDragging(false);
  dragTargetRef.current = undefined;
}

/** @param {ReportUploadBoxProps} props @param {import('preact/hooks').Ref<DragData>} dragTargetRef @param {(b: boolean) => void} setIsDragging @param {Event} e */
function handleDragOver(props, dragTargetRef, setIsDragging, e) {
  if (!dragTargetRef.current) return;
  e.stopPropagation();
  e.preventDefault();
}

/** @param {Pick<ReportUploadBoxProps, 'addToast'|'setReport'>} props @param {import('preact/hooks').Ref<DragData>} dragTargetRef @param {(b: boolean) => void} setIsDragging @param {Event} e */
function handleDrop(props, dragTargetRef, setIsDragging, e) {
  if (!dragTargetRef.current) return;
  if (!(e instanceof DragEvent)) return;
  if (!e.dataTransfer) return;
  e.stopPropagation();
  e.preventDefault();
  setIsDragging(false);
  dragTargetRef.current = undefined;
  handleFileInput(props, e.dataTransfer.files);
}

/** @param {ReportUploadBoxProps} props */
export const ReportUploadBox = props => {
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  /** @param {Event} e */
  const onDragEnter = e => handleDragEnter(props, dragTargetRef, setIsDragging, e);
  /** @param {Event} e */
  const onDragLeave = e => handleDragLeave(props, dragTargetRef, setIsDragging, e);
  /** @param {Event} e */
  const onDragOver = e => handleDragOver(props, dragTargetRef, setIsDragging, e);
  /** @param {Event} e */
  const onDrop = e => handleDrop(props, dragTargetRef, setIsDragging, e);

  useEffect(() => {
    if (props.dragTarget !== 'document') return;

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);

    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [props.dragTarget, props.addToast, props.setReport, dragTargetRef.current]);

  return (
    <div
      className={clsx(`report-upload-box report-upload-box--${props.variant}`, {
        'report-upload-box--drop': isDragging,
        'report-upload-box--document-target': props.dragTarget === 'document',
      })}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="report-upload-box__drop-outline">Drop your report to upload</div>
      <span className="report-upload-box__label">
        {props.variant === 'base' ? 'Base' : 'Compare'}
      </span>
      <div className="report-upload-box__file">
        {props.report ? (
          <FilePill report={props.report} displayType={props.displayType} />
        ) : (
          <Fragment />
        )}
      </div>
      <div className="report-upload-box__lhr-link">
        {props.report && props.showOpenLhrLink ? (
          <LhrViewerButton lhr={props.report.lhr} label="View Report" />
        ) : null}
      </div>
      <div className="report-upload-box__spacer" />
      <label className="report-upload-box__upload">
        Upload
        <input
          type="file"
          style={{display: 'none'}}
          onChange={e => {
            const input = e.target;
            if (!(input instanceof HTMLInputElement)) return;
            const fileList = input.files;
            if (!fileList || fileList.length !== 1) return;
            handleFileInput(props, fileList);
          }}
        />
      </label>
    </div>
  );
};
