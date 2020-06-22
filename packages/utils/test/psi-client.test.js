/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const PsiClient = require('../src/psi-client.js');

describe('PSI API Client', () => {
  let fetchJsonMock;
  const fetchMockImpl = () => ({json: () => fetchJsonMock(), text: () => ''});
  const apiKey = 'the-key';

  it('should request the url', async () => {
    const lighthouseResult = {finalUrl: 'https://example.com/'};
    fetchJsonMock = jest.fn().mockResolvedValue({lighthouseResult});
    const fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    const client = new PsiClient({apiKey, fetch: fetchMock});
    expect(await client.run('https://example.com')).toEqual(lighthouseResult);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexample.com&locale=en_US&strategy=mobile&key=the-key&category=performance&category=accessibility&category=best-practices&category=pwa&category=seo'
    );
  });

  it('should handle errors', async () => {
    const error = {code: 500, message: 'Server Error', errors: [{domain: 'Lighthouse'}]};
    fetchJsonMock = jest.fn().mockResolvedValue({error});
    const fetchMock = jest.fn().mockImplementation(fetchMockImpl);
    const client = new PsiClient({apiKey, fetch: fetchMock});
    await expect(client.run('https://www.google.com')).rejects.toMatchObject({
      originalError: {
        code: 500,
        errors: [{domain: 'Lighthouse'}],
      },
    });
  });
});
