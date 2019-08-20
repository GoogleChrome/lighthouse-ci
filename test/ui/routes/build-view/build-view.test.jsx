/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {api} from '../../../../src/ui/hooks/use-api-data.jsx';
import {BuildView} from '../../../../src/ui/routes/build-view/build-view.jsx';
import {render, cleanup, wait, snapshotDOM} from '../../../test-utils.js';

afterEach(cleanup);

describe('BuildView', () => {
  /** @type {import('jest-fetch-mock/types').GlobalWithFetchMock['fetch']} */
  let fetchMock;

  beforeEach(() => {
    fetchMock = global.fetch = require('jest-fetch-mock');
    api._fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch.resetMocks();
  });

  it('should render the build and missing comparison build', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'}));
    fetchMock.mockResponseOnce(JSON.stringify({commitMessage: 'test: write some tests'}));
    fetchMock.mockResponseOnce(JSON.stringify([]));
    fetchMock.mockResponseOnce(JSON.stringify([]));
    fetchMock.mockResponseOnce(JSON.stringify([]));

    const {container, getAllByText} = render(<BuildView projectId="1" buildId="2" />);
    await wait(() => getAllByText(/write some tests/));
    expect(snapshotDOM(container)).toMatchInlineSnapshot(`
      "<div>
        <span>
          <div
            class=\\"page-body__header-portal\\"
          >
            <h1>
              test: write some tests
            </h1>
          </div>
          <pre>
            {
        \\"project\\": {
          \\"name\\": \\"My Project\\"
        },
        \\"build\\": {
          \\"commitMessage\\": \\"test: write some tests\\"
        },
        \\"ancestorBuild\\": null,
        \\"buildUrls\\": [],
        \\"runs\\": []
      }
          </pre>
        </span>
      </div>"
    `);
  });

  it('should render the build and the comparison build', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'}));
    fetchMock.mockResponseOnce(
      JSON.stringify({commitMessage: 'test: write some tests', ancestorHash: '1234'})
    );
    fetchMock.mockResponseOnce(JSON.stringify([]));
    fetchMock.mockResponseOnce(JSON.stringify([{hash: '1234', commitMessage: 'fix: master'}]));
    fetchMock.mockResponseOnce(JSON.stringify([]));

    const {container, getAllByText} = render(<BuildView projectId="1" buildId="2" />);
    await wait(() => getAllByText(/write some tests/));
    expect(snapshotDOM(container)).toMatchInlineSnapshot(`
      "<div>
        <span>
          <div
            class=\\"page-body__header-portal\\"
          >
            <h1>
              test: write some tests
            </h1>
          </div>
          <pre>
            {
        \\"project\\": {
          \\"name\\": \\"My Project\\"
        },
        \\"build\\": {
          \\"commitMessage\\": \\"test: write some tests\\",
          \\"ancestorHash\\": \\"1234\\"
        },
        \\"ancestorBuild\\": {
          \\"hash\\": \\"1234\\",
          \\"commitMessage\\": \\"fix: master\\"
        },
        \\"buildUrls\\": [],
        \\"runs\\": []
      }
          </pre>
        </span>
      </div>"
    `);
  });
});
