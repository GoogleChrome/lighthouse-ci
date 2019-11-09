/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {Paper} from '../../components/paper';
import './getting-started.css';

// @ts-ignore - tsc doesn't get parcel :)
const LH_LOGO_PATH = require('../../logo.svg');

/**
 * @param {{project: LHCI.ServerCommand.Project}} props
 */
export const ProjectGettingStarted = props => {
  return (
    <div className="getting-started">
      <Paper>
        <img src={LH_LOGO_PATH} />
        <h2>
          No build data yet for {props.project.name}! Add the <pre>@lhci/cli</pre> package to your
          continuous integration to{' '}
          <a
            href="https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/getting-started.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            get started
          </a>
          .
        </h2>
      </Paper>
    </div>
  );
};
