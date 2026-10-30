/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {Fragment, h} from 'preact';
import {Nbsp} from '../../../components/nbsp';
import './simple-details.css';
import {getDiffLabel, getDeltaStats} from '@lhci/utils/src/audit-diff-finder.js';

/** @param {{type: LH.DetailsType, baseValue: any, compareValue: any, diff?: LHCI.NumericItemAuditDiff}} props */
export const SimpleDetails = props => {
  let type = props.type;
  const {compareValue, baseValue, diff} = props;
  const value = compareValue === undefined ? baseValue : compareValue;
  if (value === null || value === undefined) return <Fragment />;

  if (typeof value === 'object' && value.type) {
    type = value.type;
  }

  const label = diff ? getDiffLabel(diff) : 'neutral';

  const rawNumericBase =
    baseValue && typeof baseValue === 'object' && 'value' in baseValue
      ? baseValue.value
      : baseValue;
  const rawNumericCompare =
    compareValue && typeof compareValue === 'object' && 'value' in compareValue
      ? compareValue.value
      : compareValue;
  const numericBase = Number.isFinite(rawNumericBase) ? rawNumericBase : 0;
  const numericCompare = Number.isFinite(rawNumericCompare) ? rawNumericCompare : 0;
  const baseDisplay = `Base Value: ${Math.round(numericBase).toLocaleString()}`;
  const compareDisplay = `Compare Value: ${Math.round(numericCompare).toLocaleString()}`;
  const numericTitle = `${baseDisplay}, ${compareDisplay}`;
  const deltaPercent =
    diff && getDeltaStats(diff).percentAbsoluteDelta !== 1
      ? ` (${(getDeltaStats(diff).percentAbsoluteDelta * 100).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}%)`
      : '';

  switch (type) {
    case 'bytes': {
      const kb = Math.abs((numericCompare - numericBase) / 1024);
      return (
        <pre className={`simple-details--${label}`} data-tooltip={numericTitle}>
          {numericCompare >= numericBase ? '+' : '-'}
          {kb.toLocaleString(undefined, {maximumFractionDigits: Math.abs(kb) < 1 ? 1 : 0})}
          <Nbsp />
          KB
          {deltaPercent}
        </pre>
      );
    }
    case 'ms':
    case 'timespanMs': {
      const ms = Math.abs(Math.round(numericCompare - numericBase));
      return (
        <pre className={`simple-details--${label}`} data-tooltip={numericTitle}>
          {numericCompare >= numericBase ? '+' : '-'}
          {ms.toLocaleString()}
          <Nbsp />
          ms
          {deltaPercent}
        </pre>
      );
    }
    case 'thumbnail':
      return (
        <img
          style={{width: 48, height: 48, objectFit: 'cover'}}
          src={typeof value === 'object' && value.value ? value.value : value}
          onError={evt => {
            const img = evt.srcElement;
            if (!(img instanceof HTMLImageElement)) return;

            // On failure just replace the image with a 1x1 transparent gif.
            img.onerror = null;
            img.src =
              'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
          }}
        />
      );
    case 'url': {
      const urlString = typeof value === 'object' && value ? value.value : value;
      let display = urlString;
      let hostname = '';
      try {
        const url = new URL(urlString);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          display = url.pathname;
          hostname = url.hostname;
        }
      } catch (_) {}

      // FIXME: use title instead of data-tooltip because of the `overflow: hidden` constraints on the table cell.
      return (
        <span title={urlString}>
          {display}
          {hostname ? <span className="simple-details__url-hostname">({hostname})</span> : ''}
        </span>
      );
    }
    case 'link': {
      if (!value.url) return <span>{value.text}</span>;
      return (
        <a target="_blank" rel="noopener noreferrer" href={value.url}>
          {value.text}
        </a>
      );
    }
    case 'code':
      return <pre>{typeof value === 'object' && value ? value.value : value}</pre>;
    case 'numeric': {
      return (
        <pre className={`simple-details--${label}`}>
          {numericCompare >= numericBase ? '+' : '-'}
          {Math.abs(numericCompare - numericBase).toLocaleString()}
          {deltaPercent}
        </pre>
      );
    }
    case 'text':
      return <span>{typeof value === 'object' && value ? value.value : value}</span>;
    case 'baseline-status':
      return <span>{value.displayString || value.status}</span>;
    case 'node':
      return <pre>{value.snippet}</pre>;
    case 'source-location': {
      if (!value.url) return <pre>{JSON.stringify(value)}</pre>;
      const {url, line, column} = value;
      return (
        <pre>
          {url}:{line}:{column}
        </pre>
      );
    }
    case 'debugdata': {
      return <Fragment />;
    }
    default: {
      const debugdata = JSON.stringify(props);
      return <pre data-tooltip={debugdata}>{debugdata.slice(0, 20)}</pre>;
    }
  }
};
