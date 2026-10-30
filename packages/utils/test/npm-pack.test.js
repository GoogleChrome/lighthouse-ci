/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const {spawnSync} = require('child_process');

const PACKAGES_DIR = path.resolve(__dirname, '../..');

/**
 * @param {string} pkgName
 * @return {string[]}
 */
function getPackedFilePaths(pkgName) {
  const pkgDir = path.join(PACKAGES_DIR, pkgName);
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkgDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  expect(result.status).toBe(0);

  const parsed = JSON.parse(result.stdout);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  return entry.files.map(/** @param {{path: string}} f */ f => f.path.replace(/\\/g, '/'));
}

describe('npm pack contents', () => {
  it('includes built dist assets in @lhci/server and excludes test/storybook files', () => {
    const files = getPackedFilePaths('server');
    expect(files).toContain('src/server.js');
    expect(files).toContain('dist/index.html');
    expect(files).toContain('dist/locales/en-US.json');
    expect(files.some(f => f.startsWith('dist/chunks/entry-') && f.endsWith('.js'))).toBe(true);
    expect(files.some(f => f.startsWith('test/'))).toBe(false);
    expect(files.some(f => f.startsWith('.storybook/'))).toBe(false);
    expect(files.some(f => f.startsWith('storybook-static/'))).toBe(false);
    expect(files.some(f => f.endsWith('.stories.jsx'))).toBe(false);
    expect(files.some(f => f.includes('__mocks__/'))).toBe(false);
  });

  it('includes built dist assets in @lhci/viewer and excludes test files', () => {
    const files = getPackedFilePaths('viewer');
    expect(files).toContain('src/viewer.js');
    expect(files).toContain('dist/index.html');
    expect(files).toContain('dist/locales/en-US.json');
    expect(files.some(f => f.startsWith('dist/chunks/entry-') && f.endsWith('.js'))).toBe(true);
    expect(files.some(f => f.startsWith('test/'))).toBe(false);
  });

  it('includes src files in @lhci/cli and @lhci/utils and excludes test files', () => {
    const cliFiles = getPackedFilePaths('cli');
    expect(cliFiles).toContain('src/cli.js');
    expect(cliFiles.some(f => f.startsWith('test/'))).toBe(false);

    const utilsFiles = getPackedFilePaths('utils');
    expect(utilsFiles).toContain('src/api-client.js');
    expect(utilsFiles.some(f => f.startsWith('test/'))).toBe(false);
  });
});
