/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {api} from '../../../../src/ui/hooks/use-api-data.jsx';
import {ProjectDashboard} from '../../../../src/ui/routes/project-dashboard/project-dashboard.jsx';
import {render, cleanup, wait, snapshotDOM} from '../../../test-utils.js';

jest.mock('../../../../src/ui/layout/page');

afterEach(cleanup);

describe('ProjectDashboard', () => {
  /** @type {import('jest-fetch-mock/types').GlobalWithFetchMock['fetch']} */
  let fetchMock;

  beforeEach(() => {
    fetchMock = global.fetch = require('jest-fetch-mock');
    api._fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch.resetMocks();
  });

  it('should render a message when no builds available', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'}));
    fetchMock.mockResponseOnce(JSON.stringify([]));

    const {container, getAllByText} = render(<ProjectDashboard projectId={'abcd'} />);
    await wait(() => getAllByText(/No build/));
    expect(snapshotDOM(container)).toMatchInlineSnapshot(`
            "<div>
              <h2>
                No build data yet for 
                My Project
                !
              </h2>
            </div>"
        `);
  });

  it('should render the dashboard', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'}));
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

    const {getAllByText} = render(<ProjectDashboard projectId={'abcd'} />);
    await wait(() => getAllByText(/feature_branch/));
  });
});
