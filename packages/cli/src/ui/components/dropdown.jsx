/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import './dropdown.css';

/** @param {{options: Array<{value: string, label: string}>, value: string, setValue(v: string): void, className?: string}} props */
export const Dropdown = props => {
  const {options, value, setValue, className} = props;
  return (
    <select
      className={clsx('dropdown', className)}
      onChange={evt => {
        if (!(evt.target instanceof HTMLSelectElement)) return;
        setValue(evt.target.value);
      }}
    >
      {options.map(option => {
        return (
          <option key={option.value} value={option.value} selected={option.value === value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
};
