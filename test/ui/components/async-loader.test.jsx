/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {AsyncLoader} from '../../../src/ui/components/async-loader.jsx';
import {render, cleanup} from '../test-utils.jsx';

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
});
