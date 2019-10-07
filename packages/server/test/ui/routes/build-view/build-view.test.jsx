/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {api} from '../../../../src/ui/hooks/use-api-data.jsx';
import {BuildView} from '../../../../src/ui/routes/build-view/build-view.jsx';
import {render, cleanup, wait} from '../../../test-utils.js';

jest.mock('../../../../src/ui/layout/page');

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
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'})); // getProject
    fetchMock.mockResponseOnce(JSON.stringify({hash: 'abcd', commitMessage: 'write some tests'})); // getBuild
    fetchMock.mockResponseOnce('null', {status: 404}); // findAncestor
    fetchMock.mockResponseOnce(JSON.stringify([])); // getBuilds - ancestors
    fetchMock.mockResponseOnce(JSON.stringify([])); // getRuns - compare
    fetchMock.mockResponseOnce(JSON.stringify([])); // getRuns - base

    const {getAllByText} = render(<BuildView projectId="1" buildId="2" />);
    await wait(() => getAllByText(/write some tests/));
  });

  it('should render the build and the comparison build', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: 'My Project'})); // getProject
    fetchMock.mockResponseOnce(
      JSON.stringify({hash: 'abcd', commitMessage: 'test: write some tests', ancestorHash: '1234'})
    ); // getBuild
    fetchMock.mockResponseOnce(JSON.stringify({id: 'a', hash: '1234', commitMessage: 'fix it'})); // findAncestor
    fetchMock.mockResponseOnce(JSON.stringify([])); // getBuilds - ancestors
    fetchMock.mockResponseOnce(JSON.stringify([])); // getRuns - compare
    fetchMock.mockResponseOnce(JSON.stringify([])); // getRuns - base

    const {getAllByText} = render(<BuildView projectId="1" buildId="2" />);
    await wait(() => getAllByText(/write some tests/));
  });
});
