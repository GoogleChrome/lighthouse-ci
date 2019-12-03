/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const rc = require('../src/lighthouserc.js');
const {safeDeleteFile} = require('../../cli/test/test-utils.js');

describe('lighthouserc.js', () => {
  // Create a temp dir to store all test files.
  let tempDir;
  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouserc-'));
  });

  function writeYAMLFile(path, content) {
    fs.writeFileSync(path, yaml.safeDump(content));
  }
  describe('#loadAndParseRcFile', () => {
    function writeJSONFile(path, json) {
      fs.writeFileSync(path, JSON.stringify(json));
    }
    function getRandomFilePath(ext = 'json') {
      return path.join(tempDir, `rc-${Math.random()}.tmp.${ext}`);
    }

    let rcJSONFilePath;
    let rcYamlFilePath;
    beforeEach(() => {
      rcJSONFilePath = getRandomFilePath();
      rcYamlFilePath = getRandomFilePath('yml');
    });
    afterEach(async () => {
      await safeDeleteFile(rcJSONFilePath);
      await safeDeleteFile(rcYamlFilePath);
    });

    describe('should load a basic file', () => {
      const content = {
        ci: {
          assert: {
            assertions: {
              'speed-index': ['error', {minScore: 0.8}],
            },
          },
          collect: {
            numberOfRuns: 2,
          },
          server: {
            port: 9009,
            storage: {
              sqlDatabasePath: 'cli-test-fixtures.tmp.sql',
            },
          },
        },
      };
      const parsedContent = {
        assertions: {
          'speed-index': ['error', {minScore: 0.8}],
        },
        numberOfRuns: 2,
        port: 9009,
        storage: {
          sqlDatabasePath: 'cli-test-fixtures.tmp.sql',
        },
      };

      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });

      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });

    describe('should convert keys with . in them', () => {
      const content = {
        ci: {assert: {assertions: {'resource-summary.script.size': 'off'}}},
      };
      const parsedContent = {
        assertions: {
          'resource-summary:script:size': 'off',
        },
      };
      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });

      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });

    describe('should load and flatten other properties', () => {
      const content = {
        ci: {assert: {x: 1}},
        'ci:client': {collect: {y: 2}, server: {ignored: true}},
        'ci:server': {collect: {ignored: true}, server: {z: 3}},
      };
      const parsedContent = {
        x: 1,
        y: 2,
        z: 3,
      };
      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });
      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });
  });

  describe('#findRcFile', () => {
    const LH_ROOT = path.join(__dirname, '../../../');

    describe('should find an rcfile in the directory', () => {
      let tempFile;
      afterEach(async () => {
        await safeDeleteFile(tempFile);
        tempFile = null;
      });

      it('.json', () => {
        const expected = path.join(LH_ROOT, 'lighthouserc.json');
        expect(rc.findRcFile(LH_ROOT)).toEqual(expected);
      });
      it('.yaml', () => {
        tempFile = path.join(tempDir, 'lighthouserc.yaml');
        writeYAMLFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });
      it('.yml', () => {
        tempFile = path.join(tempDir, '.lighthouserc.yml');
        writeYAMLFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });
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
