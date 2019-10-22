/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './simple-details.css';

/** @param {{type: LH.DetailsType, baseValue: any, compareValue: any}} props */
export const SimpleDetails = props => {
  let type = props.type;
  const {compareValue, baseValue} = props;
  const value = compareValue === undefined ? baseValue : compareValue;

  if (typeof value === 'object' && value.type) {
    type = value.type;
  }

  const numericBase = Number.isFinite(baseValue) ? baseValue : 0;
  const numericCompare = Number.isFinite(compareValue) ? compareValue : 0;

  let label = 'neutral';
  if (numericCompare < numericBase) label = 'improvement';
  if (numericCompare > numericBase) label = 'regression';

  const baseDisplay = `Base Value: ${Math.round(numericBase).toLocaleString()}`;
  const compareDisplay = `Compare Value: ${Math.round(numericCompare).toLocaleString()}`;
  const title = `${baseDisplay}, ${compareDisplay}`;

  switch (type) {
    case 'bytes': {
      const kb = Math.abs((numericCompare - numericBase) / 1024);
      return (
        <pre className={`simple-details--${label}`} title={title}>
          {numericCompare >= numericBase ? '+' : '-'}
          {kb.toLocaleString(undefined, {maximumFractionDigits: Math.abs(kb) < 1 ? 1 : 0})} KB
        </pre>
      );
    }
    case 'ms':
    case 'timespanMs': {
      const ms = Math.abs(Math.round(numericCompare - numericBase));
      return (
        <pre className={`simple-details--${label}`} title={title}>
          {numericCompare >= numericBase ? '+' : '-'}
          {ms.toLocaleString()} ms
        </pre>
      );
    }
    case 'thumbnail':
      return <img style={{width: 48, height: 48, objectFit: 'cover'}} src={value} />;
    case 'url': {
      let display = value;
      let hostname = '';
      try {
        const url = new URL(value);
        display = url.pathname;
        hostname = url.hostname;
      } catch (_) {}

      return (
        <span title={value}>
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
      return <pre>{value}</pre>;
    case 'numeric': {
      return (
        <pre className={`simple-details--${label}`}>
          {numericCompare >= numericBase ? '+' : '-'}
          {Math.abs(numericCompare - numericBase).toLocaleString()}
        </pre>
      );
    }
    case 'text':
      return <span>{value}</span>;
    case 'node':
      return <pre>{value.snippet}</pre>;
    default: {
      const debugdata = JSON.stringify(props);
      return <pre title={debugdata}>{debugdata.slice(0, 20)}</pre>;
    }
  }
};
