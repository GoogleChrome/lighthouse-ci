/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const rc = require('../src/lighthouserc.js');
const {safeDeleteFile} = require('../../cli/test/test-utils.js');

describe('lighthouserc.js', () => {
  describe('#loadAndParseRcFile', () => {
    let tmpFile;
    function writeFile(json) {
      fs.writeFileSync(tmpFile, JSON.stringify(json));
    }

    beforeEach(() => {
      tmpFile = path.join(__dirname, `fixtures/rc-${Math.random()}.tmp.json`);
    });

    afterEach(async () => {
      await safeDeleteFile(tmpFile);
    });

    it('should load a basic json file', () => {
      const rcFile = path.join(__dirname, 'fixtures/lighthouserc-fixture.json');
      expect(rc.loadAndParseRcFile(rcFile)).toEqual({
        assertions: {
          'speed-index': ['error', {minScore: 0.8}],
        },
        numberOfRuns: 2,
        port: 9009,
        storage: {
          sqlDatabasePath: 'cli-test-fixtures.tmp.sql',
        },
      });
    });

    it('should convert keys with . in them', () => {
      const assertions = {'resource-summary.script.size': 'off'};
      writeFile({ci: {assert: {assertions}}});
      expect(rc.loadAndParseRcFile(tmpFile)).toEqual({
        assertions: {
          'resource-summary:script:size': 'off',
        },
      });
    });

    it('should load and flatten other properties', () => {
      writeFile({
        ci: {assert: {x: 1}},
        'ci:client': {collect: {y: 2}, server: {ignored: true}},
        'ci:server': {collect: {ignored: true}, server: {z: 3}},
      });

      expect(rc.loadAndParseRcFile(tmpFile)).toEqual({
        x: 1,
        y: 2,
        z: 3,
      });
    });
  });

  describe('#findRcFile', () => {
    const LH_ROOT = path.join(__dirname, '../../../');

    it('should find an rcfile in the directory', () => {
      const expected = path.join(LH_ROOT, 'lighthouserc.json');
      expect(rc.findRcFile(LH_ROOT)).toEqual(expected);
    });

    it('should return undefined when find-up-style but recursive is false', () => {
      expect(rc.findRcFile(__dirname)).toEqual(undefined);
    });

    it('should find an rcfile find-up-style when recursive is true', () => {
      const expected = path.join(LH_ROOT, 'lighthouserc.json');
      expect(rc.findRcFile(__dirname, {recursive: true})).toEqual(expected);
    });

    it('should return undefined when missing', () => {
      expect(rc.findRcFile(path.join(LH_ROOT, '..'))).toEqual(undefined);
    });
  });

  describe('#hasOptedOutOfRcDetection', () => {
    it('should detect --no-lighthouserc', () => {
      expect(rc.hasOptedOutOfRcDetection(['--no-lighthouserc'], {})).toEqual(true);
    });

    it('should detect --noLighthouserc', () => {
      expect(rc.hasOptedOutOfRcDetection(['--noLighthouserc'], {})).toEqual(true);
    });

    it('should detect LHCI_NO_LIGHTHOUSERC=1', () => {
      expect(rc.hasOptedOutOfRcDetection([], {LHCI_NO_LIGHTHOUSERC: '1'})).toEqual(true);
    });

    it('should not detect it in other situations', () => {
      expect(rc.hasOptedOutOfRcDetection([], {})).toEqual(false);
    });
  });
});
