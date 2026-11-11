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
    fs.writeFileSync(path, yaml.dump(content));
  }

  function writeJSONFile(path, json) {
    fs.writeFileSync(path, JSON.stringify(json));
  }

  function writeJsFile(path, json) {
    const doubleWrappedJson = JSON.stringify(JSON.stringify(json));
    fs.writeFileSync(path, `module.exports = JSON.parse(${doubleWrappedJson})`);
  }

  function writeMjsFile(path, json) {
    const doubleWrappedJson = JSON.stringify(JSON.stringify(json));
    fs.writeFileSync(path, `export default JSON.parse(${doubleWrappedJson})`);
  }

  function getRandomFilePath(ext = 'json') {
    return path.join(tempDir, `rc-${Math.random()}.tmp.${ext}`);
  }

  describe('#loadAndParseRcFile', () => {
    let rcJsFilePath;
    let rcMjsFilePath;
    let rcJSONFilePath;
    let rcYamlFilePath;

    beforeEach(() => {
      rcJsFilePath = getRandomFilePath('js');
      rcMjsFilePath = getRandomFilePath('mjs');
      rcJSONFilePath = getRandomFilePath('json');
      rcYamlFilePath = getRandomFilePath('yml');
    });

    afterEach(async () => {
      await safeDeleteFile(rcJsFilePath);
      await safeDeleteFile(rcMjsFilePath);
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

      it('Js', () => {
        writeJsFile(rcJsFilePath, content);
        expect(rc.loadAndParseRcFile(rcJsFilePath)).toEqual(parsedContent);
      });

      it('Mjs (ESM)', () => {
        writeMjsFile(rcMjsFilePath, content);
        expect(rc.loadAndParseRcFile(rcMjsFilePath)).toEqual(parsedContent);
      });

      it('Js in ESM package ("type": "module")', async () => {
        const esmDir = fs.mkdtempSync(path.join(tempDir, 'esm-pkg-'));
        const pkgJsonPath = path.join(esmDir, 'package.json');
        const esmRcPath = path.join(esmDir, '.lighthouserc.js');
        try {
          writeJSONFile(pkgJsonPath, {type: 'module'});
          writeMjsFile(esmRcPath, content);
          expect(rc.loadAndParseRcFile(esmRcPath)).toEqual(parsedContent);
        } finally {
          await safeDeleteFile(esmRcPath);
          await safeDeleteFile(pkgJsonPath);
          fs.rmdirSync(esmDir);
        }
      });

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
        ci: {
          assert: {
            assertions: {
              'resource-summary.script.size': 'off',
              'categories.performance': ['warn', {minScore: 0.9}],
            },
          },
        },
      };
      const parsedContent = {
        assertions: {
          'resource-summary:script:size': 'off',
          'categories:performance': ['warn', {minScore: 0.9}],
        },
      };

      it('Js', () => {
        writeJsFile(rcJsFilePath, content);
        expect(rc.loadAndParseRcFile(rcJsFilePath)).toEqual(parsedContent);
      });

      it('Mjs (ESM default export)', () => {
        writeMjsFile(rcMjsFilePath, content);
        expect(rc.loadAndParseRcFile(rcMjsFilePath)).toEqual(parsedContent);
      });

      it('Mjs (ESM named export)', () => {
        fs.writeFileSync(rcMjsFilePath, `export const ci = ${JSON.stringify(content.ci)};`);
        expect(rc.loadAndParseRcFile(rcMjsFilePath)).toEqual(parsedContent);
      });

      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });

      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });

    describe('should preserve non-JSON values in JS configs', () => {
      const configBody = `{
        ci: {
          assert: {assertions: {'resource-summary.script.size': 'off'}},
          server: {
            maxSize: Infinity,
            storage: {
              sequelizeOptions: {
                logging: (msg) => 'logged:' + msg,
                dialectOptions: {ssl: {ca: Buffer.from('my-cert')}},
              },
            },
          },
          upload: {urlReplacementPatterns: [/foo/gi]},
        },
      }`;

      function expectNonJsonValuesPreserved(parsed) {
        expect(parsed.assertions).toEqual({'resource-summary:script:size': 'off'});
        expect(parsed.maxSize).toBe(Infinity);
        const {logging, dialectOptions} = parsed.storage.sequelizeOptions;
        expect(typeof logging).toBe('function');
        expect(logging('hi')).toBe('logged:hi');
        // Config modules are loaded outside of Jest's VM context, so avoid `instanceof` checks.
        expect(Buffer.isBuffer(dialectOptions.ssl.ca)).toBe(true);
        expect(dialectOptions.ssl.ca.toString()).toBe('my-cert');
        const [regex] = parsed.urlReplacementPatterns;
        expect(Object.prototype.toString.call(regex)).toBe('[object RegExp]');
        expect(regex.source).toBe('foo');
        expect(regex.flags).toBe('gi');
      }

      it('Js', () => {
        fs.writeFileSync(rcJsFilePath, `module.exports = ${configBody};`);
        expectNonJsonValuesPreserved(rc.loadAndParseRcFile(rcJsFilePath));
      });

      it('Mjs (ESM default export)', () => {
        fs.writeFileSync(rcMjsFilePath, `export default ${configBody};`);
        expectNonJsonValuesPreserved(rc.loadAndParseRcFile(rcMjsFilePath));
      });

      it('Mjs (ESM named export)', () => {
        fs.writeFileSync(rcMjsFilePath, `export const {ci} = ${configBody};`);
        expectNonJsonValuesPreserved(rc.loadAndParseRcFile(rcMjsFilePath));
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

      it('Js', () => {
        writeJsFile(rcJsFilePath, content);
        expect(rc.loadAndParseRcFile(rcJsFilePath)).toEqual(parsedContent);
      });

      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });

      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });

    describe('should load overlapping upload and wizard configuration', () => {
      const content = {
        ci: {
          upload: {
            serverBaseUrl: 'http://localhost:9009',
            extraHeaders: '{"Authorization": "Basic bGlnaHRob3VzZTpjaQo="}',
          },
          wizard: {
            serverBaseUrl: 'https://localhost:9010',
            extraHeaders: '{"Authorization": "Basic noContent"}',
          },
        },
      };

      const parsedContent = {
        serverBaseUrl: 'http://localhost:9009',
        extraHeaders: '{"Authorization": "Basic bGlnaHRob3VzZTpjaQo="}',
      };

      it('Js', () => {
        writeJsFile(rcJsFilePath, content);
        expect(rc.loadAndParseRcFile(rcJsFilePath)).toEqual(parsedContent);
      });

      it('JSON', () => {
        writeJSONFile(rcJSONFilePath, content);
        expect(rc.loadAndParseRcFile(rcJSONFilePath)).toEqual(parsedContent);
      });

      it('YAML', () => {
        writeYAMLFile(rcYamlFilePath, content);
        expect(rc.loadAndParseRcFile(rcYamlFilePath)).toEqual(parsedContent);
      });
    });

    describe('should load wizard configuration', () => {
      const content = {
        ci: {
          wizard: {
            serverBaseUrl: 'http://localhost:9009',
            extraHeaders: '{"Authorization": "Basic bGlnaHRob3VzZTpjaQo="}',
          },
        },
      };

      const parsedContent = {
        serverBaseUrl: 'http://localhost:9009',
        extraHeaders: '{"Authorization": "Basic bGlnaHRob3VzZTpjaQo="}',
      };

      it('Js', () => {
        writeJsFile(rcJsFilePath, content);
        expect(rc.loadAndParseRcFile(rcJsFilePath)).toEqual(parsedContent);
      });

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

      it('.cjs', () => {
        tempFile = path.join(tempDir, 'lighthouserc.cjs');
        writeJsFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });

      it('.mjs', () => {
        tempFile = path.join(tempDir, 'lighthouserc.mjs');
        writeMjsFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });

      it('.lighthouserc.mjs', () => {
        tempFile = path.join(tempDir, '.lighthouserc.mjs');
        writeMjsFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });

      it('.js', () => {
        tempFile = path.join(tempDir, 'lighthouserc.js');
        writeJsFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
      });

      it('.json', () => {
        tempFile = path.join(tempDir, 'lighthouserc.json');
        writeJSONFile(tempFile, {});
        expect(rc.findRcFile(tempDir)).toEqual(tempFile);
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
      const expected = path.join(LH_ROOT, '.lighthouserc.js');
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
