/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {
  AsyncLoader,
  combineLoadingStates,
  combineAsyncData,
} from '../../../src/ui/components/async-loader.jsx';
import {render, cleanup} from '../../test-utils.js';

afterEach(cleanup);

describe('AsyncLoader', () => {
  it('should render the loading state', async () => {
    const {container} = render(<AsyncLoader loadingState="loading" />);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<h1>Loading...</h1>"`);
  });

  it('should render the error state', async () => {
    const {container} = render(<AsyncLoader loadingState="error" />);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<h1>Lighthouse Error</h1>"`);
  });

  it('should render the loaded state', async () => {
    const {container} = render(
      <AsyncLoader
        loadingState="loaded"
        asyncData={{x: 1}}
        render={data => <span>{JSON.stringify(data)}</span>}
      />
    );

    expect(container.innerHTML).toMatchInlineSnapshot(`"<span>{\\"x\\":1}</span>"`);
  });

  it('should redirect in the loaded but undefined state', async () => {
    const {container} = render(<AsyncLoader loadingState="loaded" asyncData={undefined} />);
    expect(container.innerHTML).toMatchInlineSnapshot(`"<div to=\\"/app/projects\\"></div>"`);
  });
});

describe('combineLoadingStates', () => {
  it('should combine loaded states', () => {
    expect(combineLoadingStates(['loaded', 1], ['loaded', 2], ['loaded', 3])).toEqual('loaded');
  });

  it('should combine error states', () => {
    expect(
      combineLoadingStates(['loaded', 1], ['error', undefined], ['loading', undefined])
    ).toEqual('error');
  });

  it('should combine loading states', () => {
    expect(combineLoadingStates(['loaded', 1], ['loading', undefined], ['loaded', 1])).toEqual(
      'loading'
    );
  });
});

describe('combineAsyncData', () => {
  it('should return undefined when 2 undefined', () => {
    expect(combineAsyncData(['loading', undefined], ['error', undefined])).toEqual(undefined);
  });

  it('should return undefined when 1 undefined, 1 set', () => {
    expect(combineAsyncData(['loaded', 1], ['loading', undefined])).toEqual(undefined);
  });

  it('should return values when 2 set', () => {
    expect(combineAsyncData(['loaded', 1], ['loaded', 2])).toEqual([1, 2]);
  });

  it('should return undefined when 1 undefined, 3 set', () => {
    const values = [
      ['loaded', 1],
      ['loading', undefined],
      ['loading', undefined],
      ['loading', undefined],
    ];

    expect(combineAsyncData(...values)).toEqual(undefined);
  });

  it('should return values when 4 set', () => {
    const values = [['loaded', 1], ['loaded', 2], ['loaded', 3], ['loaded', 4]];

    expect(combineAsyncData(...values)).toEqual([1, 2, 3, 4]);
  });
});
