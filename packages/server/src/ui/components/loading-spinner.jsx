/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import clsx from 'clsx';
import './loading-spinner.css';

const LoadingSpinner_ = () => {
  return (
    <svg viewBox="0 0 100 100">
      <path>
        <animate
          attributeName="d"
          dur="2000ms"
          repeatCount="indefinite"
          keyTimes="0;
                   .0625;
                   .3125;
                   .395833333;
                   .645833333;
                   .833333333;
                   1"
          calcMode="spline"
          keySplines="0,0,1,1;
                     .42,0,1,1;
                     0,0,.58,1;
                     .42,0,.58,1;
                     .42,0,.58,1;
                     .42,0,.58,1"
          values="M 0,0 C 50,0 50,0 100,0 100,50 100,50 100,100
                 50,100 50,100 0,100 0,50 0,50 0,0 Z;

                 M 0,0 C 50,0 50,0 100,0 100,50 100,50 100,100
                 50,100 50,100 0,100 0,50 0,50 0,0 Z;

                 M 50,0 C 75,50 75,50 100,100 50,100 50,100 0,100
                 12.5,75 12.5,75 25,50 37.5,25 37.5,25 50,0 Z;

                 M 50,0 C 75,50 75,50 100,100 50,100 50,100 0,100
                 12.5,75 12.5,75 25,50 37.5,25 37.5,25 50,0 Z;

                 M 100,50 C 100,77.6 77.6,100 50,100 22.4,100 0,77.6
                 0,50 0,22.4 22.4,0 50,0 77.6,0 100,22.4 100,50 Z;

                 M 100,50 C 100,77.6 77.6,100 50,100 22.4,100 0,77.6
                 0,50 0,22.4 22.4,0 50,0 77.6,0 100,22.4 100,50 Z;

                 M 100,100 C 50,100 50,100 0,100 0,50 0,50 0,0
                 50,0 50,0 100,0 100,50 100,50 100,100 Z;"
        />
        <animate
          attributeName="fill"
          dur="2000ms"
          repeatCount="indefinite"
          keyTimes="0;
                   .0625;
                   .3125;
                   .395833333;
                   .645833333;
                   .833333333;
                   1"
          calcMode="spline"
          keySplines="0,0,1,1;
                     .42,0,1,1;
                     0,0,.58,1;
                     .42,0,.58,1;
                     .42,0,.58,1;
                     .42,0,.58,1"
          values="#FFA400;
                 #FFA400;
                 #FF4E42;
                 #FF4E42;
                 #0CCE6B;
                 #0CCE6B;
                 #FFA400;"
        />
      </path>
    </svg>
  );
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
