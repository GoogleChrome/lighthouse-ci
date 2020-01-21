/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import _ from '@lhci/utils/src/lodash.js';
import {AsyncLoader} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';

import './category-graphs.css';
import {CategoryScoreGraph} from './category-score-graph';

/** @typedef {import('./project-graphs-redesign.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {{title: string, category: 'performance'|'pwa', statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[]}} props */
export const CategoryGraphs = props => {
  return (
    <Paper className="category-graphs">
      <div className="category-graphs__header">
        <h3 className="category-graphs__title">{props.title}</h3>
      </div>
      <div className="category-graphs__body">
        <AsyncLoader
          loadingState={props.loadingState}
          asyncData={props.statistics}
          render={allStats => (
            <Fragment>
              <CategoryScoreGraph {...props} statistics={allStats} />
              <pre>
                Data goes here...
                {JSON.stringify(allStats, null, 2)}
              </pre>
            </Fragment>
          )}
        />
      </div>
    </Paper>
  );
};
