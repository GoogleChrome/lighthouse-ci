/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';

/** @param {{type: LH.DetailsType, value: any}} props */
export const SimpleDetails = props => {
  if (typeof props.value === 'object' && props.value.type) {
    return <SimpleDetails {...props.value} />;
  }

  switch (props.type) {
    case 'bytes':
      return <span>{Math.round(props.value / 1024).toLocaleString()} KB</span>;
    case 'ms':
    case 'timespanMs':
      return <span>{Math.round(props.value).toLocaleString()} ms</span>;
    case 'thumbnail':
      return <img style={{width: 48, height: 48, objectFit: 'cover'}} src={props.value} />;
    case 'url':
      return <span>{new URL(props.value).pathname}</span>;
    case 'code':
      return <pre>{props.value}</pre>;
    case 'numeric':
      return <span>{Number(props.value).toLocaleString()}</span>;
    case 'text':
      return <span>{props.value}</span>;
    default:
      return <pre>{JSON.stringify(props).slice(0, 20)}</pre>;
  }
};
