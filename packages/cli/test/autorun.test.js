/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const {getOverrideArgsForCommand} = require('../src/autorun/autorun.js');
const {runCLI, withTmpDir} = require('./test-utils.js');

describe('getOverrideArgsForCommand', () => {
  it('should filter to the correct collect arguments', async () => {
    const args = ['--collect.url=http://example.com', '--upload.target=temporary-public-storage'];
    const out = getOverrideArgsForCommand('collect', args);
    expect(out).toEqual(['--url=http://example.com']);
  });

  it('pass through shared arguments', async () => {
    const args = ['--no-lighthouserc', '--noLighthouserc'];
    const out = getOverrideArgsForCommand('collect', args);
    expect(out).toEqual(['--no-lighthouserc', '--noLighthouserc']);
  });

  it('only support `=` syntax', async () => {
    const args = ['--upload.target', 'lhci'];
    const out = getOverrideArgsForCommand('upload', args);
    expect(out).toEqual(['--target']);
  });
});

describe('Lighthouse CI autorun CLI', () => {
  const env = {
    LHCITEST_IGNORE_CHROME_INSTALLATIONS: '1',
    LHCI_COLLECT__METHOD: undefined,
    LHCI_COLLECT__CHROME_PATH: undefined,
    LHCI_PSI_API_KEY: undefined,
    LHCI_COLLECT__PSI_API_KEY: undefined,
  };

  it.each([
    {source: 'the CLI flag', args: ['--collect.method=psi'], overrides: {}},
    {source: 'the environment variable', args: [], overrides: {LHCI_COLLECT__METHOD: 'psi'}},
    {
      source: 'the environment variable overriding the CLI flag',
      args: ['--collect.method=node'],
      overrides: {LHCI_COLLECT__METHOD: 'psi'},
    },
    {
      source: 'matching collect and healthcheck flags',
      args: ['--collect.method=psi', '--healthcheck.method=psi'],
      overrides: {},
    },
  ])('should reach PSI collection without Chrome via $source', async ({args, overrides}) => {
    await withTmpDir(async cwd => {
      const {stdout, stderr, status} = await runCLI(
        ['autorun', '--collect.url=https://example.com', ...args],
        {cwd, env: {...env, ...overrides}, useMockLhr: true}
      );
      expect(stdout).toContain('Healthcheck passed!');
      expect(stderr).toContain('PSI API key must be provided to use the PSI runner');
      expect(status).toBe(1);
    });
  });

  it.each([
    {source: 'without Chrome', args: [], output: 'Chrome installation not found', status: 1},
    {
      source: 'with an explicit Chrome path',
      args: [`--collect.chrome-path=${process.execPath}`],
      output: 'Done running autorun.',
      status: 0,
    },
  ])('should check Chrome for a Node override of a PSI config $source', async testCase => {
    await withTmpDir(async cwd => {
      const rcFile = path.join(cwd, 'lighthouserc.json');
      const ci = {
        collect: {method: 'psi', url: ['https://example.com'], numberOfRuns: 1},
        assert: {assertions: {viewport: 'warn'}},
      };
      fs.writeFileSync(rcFile, JSON.stringify({ci}));

      const {stdout, status} = await runCLI(
        ['autorun', `--config=${rcFile}`, '--collect.method=node', ...testCase.args],
        {cwd, env, useMockLhr: true}
      );
      expect(stdout).toContain(testCase.output);
      expect(status).toBe(testCase.status);
    });
  });
});
