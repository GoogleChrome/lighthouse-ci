/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');
const PuppeteerManager = require('../src/collect/puppeteer-manager.js');

describe('PuppeteerManager', () => {
  it.each(['puppeteer', 'puppeteer-core'])(
    'prefers the %s installation in the current project',
    packageName => {
      const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lhci-puppeteer-'));
      const puppeteerDir = path.join(projectDir, 'node_modules', packageName);
      fs.mkdirSync(puppeteerDir, {recursive: true});
      fs.writeFileSync(
        path.join(puppeteerDir, 'index.js'),
        `module.exports = {source: '${packageName}'};`
      );
      const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(projectDir);

      try {
        expect(PuppeteerManager._requirePuppeteer().source).toBe(packageName);
      } finally {
        cwdSpy.mockRestore();
        fs.rmSync(projectDir, {recursive: true, force: true});
      }
    }
  );

  it('falls back to the CLI dependency tree', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lhci-puppeteer-'));
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(projectDir);

    try {
      expect(PuppeteerManager._requirePuppeteer().launch).toEqual(expect.any(Function));
    } finally {
      cwdSpy.mockRestore();
      fs.rmSync(projectDir, {recursive: true, force: true});
    }
  });
});
