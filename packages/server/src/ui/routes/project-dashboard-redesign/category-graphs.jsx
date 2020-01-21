/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import _ from '@lhci/utils/src/lodash.js';
import {AsyncLoader} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';

import './category-graphs.css';
import {LoadingSpinner} from '../../components/loading-spinner';

/** @typedef {import('./project-graphs-redesign.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {{title: string, category: 'performance'|'pwa', statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[]}} props */
export const CategoryGraphs = props => {
  return (
    <AsyncLoader
      loadingState={props.loadingState}
      asyncData={props.statistics}
      renderLoading={() => (
        <Paper className="category-graphs">
          <LoadingSpinner />
        </Paper>
      )}
      render={allStats => {
        return (
          <Paper className="category-graphs">
            <div className="category-graphs__header">
              <h3 className="category-graphs__title">{props.title}</h3>
            </div>
            <pre>
              Data goes here...
              {JSON.stringify(allStats, null, 2)}
            </pre>
          </Paper>
        );
      }}
    />
  );
};
