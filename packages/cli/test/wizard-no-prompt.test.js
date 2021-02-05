/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI healthcheck CLI', () => {
  const autorunFixtureDir = path.join(__dirname, 'fixtures/autorun-static-dir');

  describe('wizard', () => {
    it('should run new-project wizard without args', async () => {
      const {stdout, stderr, status} = await runCLI([
        '--wizard=new-project',
        '--basicAuth.username=admin',
        '--basicAuth.password=io',
        '--serverBaseUrl="https://lighthouse.hello.world"',
        '--projectName="some-new-project"',
        '--projectExternalUrl="https://somewhere.else"',
        '--projectBaseBranch="master"',
      ]);
      expect(status).toEqual(0);
      expect(stdout).toMatchInlineSnapshot(`
        "? Which wizard do you want to run? new-project
? What would you like to name the project? lighthouse-ci
? Where is the project's code hosted? OtherCIProjectName
? What branch is considered the repo's trunk or main branch? https://example.com

    Created project lighthouse-ci (ffd25a76-953d-4351-9a7d-c41315908626)!
    Use build token 0278ea14-c2d6-4394-b305-cbc5900ef9da to add data.
    Use admin token IPlUPwEuzCrHQ4uwF2UvdlJI4ElChsiFPk1lZnGf to manage data. KEEP THIS SECRET!"
      `);
      expect(stderr).toMatchInlineSnapshot(`""`);
    });
  });
});
