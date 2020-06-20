/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const ApiClient = require('../src/api-client.js');

describe('Lighthouse CI API Client', () => {
  const fetchMockImpl = () => ({json: () => ({}), text: () => ''});

  it('should normalize URLs relative to root', async () => {
    let fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    let client = new ApiClient({rootURL: 'http://localhost:9000', fetch: fetchMock});
    await client.getProjects();
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:9000/v1/projects`, {headers: {}});

    fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    client = new ApiClient({rootURL: 'http://localhost:9000/', fetch: fetchMock});
    await client.getProjects();
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:9000/v1/projects`, {headers: {}});

    fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    client = new ApiClient({rootURL: 'http://localhost:9000/lhci/', fetch: fetchMock});
    await client.getProjects();
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:9000/lhci/v1/projects`, {headers: {}});
  });

  it('should pass through headers', async () => {
    const fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    const client = new ApiClient({
      rootURL: 'http://localhost:9000',
      fetch: fetchMock,
      extraHeaders: {Authorization: 'Bearer 1234'},
    });

    await client.getVersion();
    expect(fetchMock.mock.calls[0][1]).toEqual({headers: {Authorization: 'Bearer 1234'}});
    await client.getProjects();
    expect(fetchMock.mock.calls[1][1]).toEqual({headers: {Authorization: 'Bearer 1234'}});
    await client.createProject({name: 'Foo'});
    expect(fetchMock.mock.calls[2][1]).toEqual({
      method: 'POST',
      body: JSON.stringify({name: 'Foo'}),
      headers: {Authorization: 'Bearer 1234', 'content-type': 'application/json'},
    });
  });

  describe('getBuilds', () => {
    it('pass branch through to API', async () => {
      const fetchMock = jest.fn().mockImplementation(fetchMockImpl);
      const client = new ApiClient({rootURL: 'http://localhost:9000', fetch: fetchMock});
      await client.getBuilds('124', {branch: 'master'});
      expect(fetchMock).toHaveBeenCalledWith(
        `http://localhost:9000/v1/projects/124/builds?branch=master`,
        {headers: {}}
      );
    });
  });

  describe('#isApiVersionCompatible', () => {
    const isCompatible = (s1, s2) => ApiClient.isApiVersionCompatible(s1, s2);

    it('should recognize compatible versions', () => {
      expect(isCompatible('v0.0.1', 'v0.0.2')).toBe(true);
      expect(isCompatible('1.0.1', '1.4.2')).toBe(true);
      expect(isCompatible('2.1.1-alpha.1', '2.0.0')).toBe(true);
      expect(isCompatible('v0.3.1', 'v0.3.2')).toBe(true);
      expect(isCompatible('^0.0.1', '0.0.2')).toBe(true);
      expect(isCompatible('0.0.1', '0.0.2')).toBe(true);
      // We're committed to letting clients talk to 1 major behind
      expect(isCompatible('0.4.1', '0.3.2')).toBe(true);
    });

    it('should recognize incompatible versions', () => {
      expect(isCompatible('0.5.1', '0.3.2')).toBe(false);
      expect(isCompatible('0.3.2', '0.4.1')).toBe(false);
      expect(isCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(isCompatible('0.1.1', '1.0.2')).toBe(false);
      expect(isCompatible('2.1.1-alpha.1', '1.0.2')).toBe(false);
    });

    it('should return false on invalid versions', () => {
      expect(isCompatible('a.b.c', 'a.b.c')).toBe(false);
      expect(isCompatible('0.1', '0.1')).toBe(false);
      expect(isCompatible('vtwo', 'vtwo')).toBe(false);
    });
  });
});
