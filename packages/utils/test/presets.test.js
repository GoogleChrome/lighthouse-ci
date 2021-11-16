/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const defaultConfig = require('lighthouse/lighthouse-core/config/default-config.js');

const PRESETS_DIR = path.join(__dirname, '../src/presets');

describe('presets', () => {
  let auditsInLighthouse = [];

  beforeAll(() => {
    const audits = defaultConfig.audits
      .map(p => [
        p,
        fs.readFileSync(require.resolve(`lighthouse/lighthouse-core/audits/${p}`), 'utf8'),
      ])
      .map(([p, contents]) => ({
        path: p,
        id: contents.match(/\s+id: '([^']+)',/)[1],
        isManual: !!contents.match(/MANUAL|\/manual-audit/),
      }));

    auditsInLighthouse = audits.filter(a => !a.isManual).map(a => a.id);
  });

  for (const presetName of fs.readdirSync(PRESETS_DIR)) {
    it(`${presetName} should contain all the audits of lighthouse`, () => {
      const preset = require(path.join(PRESETS_DIR, presetName));
      const auditsInPreset = Object.keys(preset.assertions);

      const auditsMissingFromPreset = auditsInLighthouse.filter(a => !auditsInPreset.includes(a));
      const auditsMissingFromLh = auditsInPreset.filter(a => !auditsInLighthouse.includes(a));
      expect(auditsMissingFromPreset).toEqual([]);
      expect(auditsMissingFromLh).toEqual([]);
    });
  }
});
