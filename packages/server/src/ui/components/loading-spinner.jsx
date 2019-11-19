/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import './loading-spinner.css';

// @ts-ignore - tsc doesn't understand parcel :)
const SVG_PATH = require('./loading-spinner.svg');

const LoadingSpinner_ = () => {
  return <img src={SVG_PATH} alt="Loading spinner" />;
};

/** @param {{solo?: boolean}} props */
export const LoadingSpinner = props => {
  return (
    <div
      className={clsx('loading-spinner', {
        'loading-spinner--container': !props.solo,
      })}
    >
      <LoadingSpinner_ />
    </div>
  );
};
