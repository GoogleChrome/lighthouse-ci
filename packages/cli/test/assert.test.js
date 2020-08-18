/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

jest.retryTimes(3);

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const fullPreset = require('@lhci/utils/src/presets/all.js');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI assert CLI', () => {
  const fixtureDir = path.join(__dirname, 'fixtures/assertions');
  // eslint-disable-next-line no-control-regex
  const replaceTerminalChars = s => s.replace(/\u001b/g, '').replace(/\[\d+m/g, '');
  const run = async args => {
    const {status, stdout, stderr} = await runCLI(['assert', ...args], {cwd: fixtureDir});
    const failures = (stderr.match(/\S+ failure/g) || []).map(replaceTerminalChars);
    const warnings = (stderr.match(/\S+ warning/g) || []).map(replaceTerminalChars);
    const passes = (stderr.match(/\S+ passing/g) || []).map(replaceTerminalChars);
    // Assert that we didn't fail with a stack trace :)
    expect(stderr).not.toContain('TypeError: ');
    expect(stderr).not.toContain(path.join(__dirname, '../../'));
    return {status, stdout, stderr, failures, warnings, passes};
  };

  const writeLhr = (passingAuditIds = []) => {
    const lighthouseciDir = path.join(fixtureDir, '.lighthouseci');
    if (fs.existsSync(lighthouseciDir)) rimraf.sync(lighthouseciDir);
    if (!fs.existsSync(lighthouseciDir)) fs.mkdirSync(lighthouseciDir, {recursive: true});
    const fakeLhrPath = path.join(lighthouseciDir, 'lhr-12345.json');
    const fakeLhr = {categories: {}, audits: {}};
    fakeLhr.categories.pwa = {score: 0};
    fakeLhr.audits['performance-budget'] = {score: 0};
    for (const key of Object.keys(fullPreset.assertions)) {
      fakeLhr.audits[key] = {score: passingAuditIds.includes(key) ? 1 : 0, details: {items: [{}]}};
    }

    fs.writeFileSync(fakeLhrPath, JSON.stringify(fakeLhr));
  };

  beforeAll(() => {
    writeLhr(['first-contentful-paint']);
  });

  it('should run the recommended preset', async () => {
    const result = await run([`--preset=lighthouse:recommended`]);
    expect(result.status).toEqual(1);
    expect(result.failures.length).toMatchInlineSnapshot(`94`);
    expect(result.warnings.length).toMatchInlineSnapshot(`19`);
    expect(result.passes.length).toMatchInlineSnapshot(`0`);
    expect(result.failures).toContain('deprecations failure');
    expect(result.failures).toContain('viewport failure');
  });

  it('should run the no-pwa preset', async () => {
    const result = await run([`--preset=lighthouse:no-pwa`]);
    expect(result.status).toEqual(1);
    expect(result.failures.length).toMatchInlineSnapshot(`83`);
    expect(result.warnings.length).toMatchInlineSnapshot(`17`);
    expect(result.passes.length).toMatchInlineSnapshot(`0`);
    expect(result.failures).toContain('deprecations failure');
    expect(result.failures).not.toContain('viewport failure');
  });

  it('should run a preset with options', async () => {
    const result = await run([`--preset=lighthouse:no-pwa`, '--assertions.deprecations=off']);
    expect(result.failures).not.toContain('deprecations failure');
    expect(result.failures).not.toContain('viewport failure');
  });

  it('should run assertions from a config', async () => {
    const result = await run([`--config=${fixtureDir}/../lighthouserc.json`]);
    expect(result.failures).toContain('speed-index failure');
  });

  it('should return passing audits', async () => {
    const result = await run([`--preset=lighthouse:recommended`, '--include-passed-assertions']);
    expect(result.status).toEqual(1);
    expect(result.warnings.length).toMatchInlineSnapshot(`19`);
    expect(result.failures.length).toMatchInlineSnapshot(`94`);
    expect(result.passes.length).toMatchInlineSnapshot(`1`);
    expect(result.passes).toContain('first-contentful-paint passing');
    expect(result.failures).toContain('viewport failure');
  });

  it('should set the status code of failures appropriately', async () => {
    const result = await run([`--assertions.deprecations=error`]);
    expect(result.status).toEqual(1);
    expect(result.failures.length).toMatchInlineSnapshot(`1`);
    expect(result.warnings.length).toMatchInlineSnapshot(`0`);
    expect(result.passes.length).toMatchInlineSnapshot(`0`);
  });

  it('should set the status code of warnings appropriately', async () => {
    const result = await run([`--assertions.deprecations=warn`, '--include-passed-assertions']);
    expect(result.status).toEqual(0);
    expect(result.failures.length).toMatchInlineSnapshot(`0`);
    expect(result.warnings.length).toMatchInlineSnapshot(`1`);
    expect(result.passes.length).toMatchInlineSnapshot(`0`);
  });

  it('should set the status code of passes appropriately', async () => {
    const result = await run([
      `--assertions.first-contentful-paint=error`,
      '--include-passed-assertions',
    ]);
    expect(result.status).toEqual(0);
    expect(result.failures.length).toMatchInlineSnapshot(`0`);
    expect(result.warnings.length).toMatchInlineSnapshot(`0`);
    expect(result.passes.length).toMatchInlineSnapshot(`1`);
  });
});
