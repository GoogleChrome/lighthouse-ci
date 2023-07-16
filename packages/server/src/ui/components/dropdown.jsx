/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import clsx from 'clsx';
import './dropdown.css';

/** @param {{options: Array<{value: string, label: string}>, value: string, setValue(v: string): void, className?: string, title?: string, label?: string}} props */
export const Dropdown = props => {
  const {options, value, setValue, className, title, label} = props;
  const computedOptions = options.some(option => option.value === value)
    ? options
    : [...options, {value, label: value}];
  return (
    <div
      className={clsx('dropdown', className)}
      style={{position: 'relative'}}
      data-tooltip={title}
    >
      <label>
        {label ? <span className="dropdown__label">{label}</span> : <Fragment />}
        <select
          onChange={evt => {
            if (!(evt.target instanceof HTMLSelectElement)) return;
            setValue(evt.target.value);
          }}
        >
          {computedOptions.map(option => {
            return (
              <option key={option.value} value={option.value} selected={option.value === value}>
                {option.label}
              </option>
            );
          })}
        </select>
      </label>
      <div className="dropdown__chevron">
        <i className="material-icons">arrow_drop_down</i>
      </div>
    </div>
  );
};
