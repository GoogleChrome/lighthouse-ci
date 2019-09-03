/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const ApiClient = require('../src/api-client.js');

describe('Lighthouse CI API Client', () => {
  const fetchMockImpl = () => ({json: () => ({})});
  it('should normalize URLs relative to root', async () => {
    let fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    let client = new ApiClient({rootURL: 'http://localhost:9000', fetch: fetchMock});
    await client.getProjects();
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:9000/v1/projects`);

    fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    client = new ApiClient({rootURL: 'http://localhost:9000/', fetch: fetchMock});
    await client.getProjects();
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:9000/v1/projects`);
  });

  describe('getBuilds', () => {
    it('pass branch through to API', async () => {
      const fetchMock = jest.fn().mockImplementation(fetchMockImpl);
      const client = new ApiClient({rootURL: 'http://localhost:9000', fetch: fetchMock});
      await client.getBuilds('124', {branch: 'master'});
      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:9000/v1/projects/124/builds?branch=master`
      );
    });
  });
});
