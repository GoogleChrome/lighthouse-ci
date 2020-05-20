/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {api} from '../../../../src/ui/hooks/use-api-data.jsx';
import {ProjectDashboard} from '../../../../src/ui/routes/project-dashboard/project-dashboard.jsx';
import {render, cleanup, wait} from '../../../test-utils.js';

jest.mock('../../../../src/ui/layout/page');

afterEach(cleanup);

describe('ProjectDashboard', () => {
  /** @type {import('jest-fetch-mock/types').GlobalWithFetchMock['fetch']} */
  let fetchMock;

  beforeEach(() => {
    fetchMock = global.fetch = require('jest-fetch-mock');
    api._fetch = (...args) => {
      if (process.env.DEBUG) console.log('fetching', args); // eslint-disable-line
      return fetchMock(...args);
    };
  });

  afterEach(() => {
    global.fetch.resetMocks();
  });

  it('should render a message when no builds available', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({id: '1', name: 'My Project'})); // fetch project
    fetchMock.mockResponseOnce(JSON.stringify([])); // fetch builds
    fetchMock.mockResponseOnce(JSON.stringify([])); // fetch branches
    fetchMock.mockResponseOnce(JSON.stringify([])); // fetch build URLs

    const {getAllByText} = render(<ProjectDashboard projectSlug={'abcd'} />);
    await wait(() => getAllByText(/No build/));
  });

  it('should render the dashboard', async () => {
    // fetch the project
    fetchMock.mockResponseOnce(JSON.stringify({id: '1', name: 'My Project'}));
    // fetch the builds
    fetchMock.mockResponseOnce(
      JSON.stringify([
        {
          id: '1',
          branch: 'master',
          hash: 'abcdef',
          externalBuildUrl: 'http://localhost:1337/builds/a/',
          runAt: new Date('2019-07-04').toISOString(),
        },
        {
          id: '2',
          branch: 'feature_branch',
          hash: 'abcdef',
          externalBuildUrl: 'http://localhost:1337/builds/b/',
          runAt: new Date('2019-07-09').toISOString(),
        },
      ])
    );
    // fetch the branches
    fetchMock.mockResponseOnce(JSON.stringify([{branch: 'master'}, {branch: 'feature_branch'}]));
    // fetch the URLs
    fetchMock.mockResponseOnce(JSON.stringify([{url: 'http://localhost:1000/foo'}]));
    // fetch the representative run
    fetchMock.mockResponseOnce(JSON.stringify([{id: '1', projectId: '1', lhr: ''}]));
    // fetch build stats
    fetchMock.mockResponseOnce(JSON.stringify([]));

    const {getAllByText} = render(<ProjectDashboard projectSlug={'abcd'} />);
    await wait(() => getAllByText(/feature_branch/));
  });
});
