/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const {withTmpDir} = require('../../cli/test/test-utils.js');
const {replaceUrlPatterns, getFinalUrl, saveLHR} = require('../src/saved-reports.js');
const {promisify} = require('util');
const {exec} = require('child_process');

const execAsync = promisify(exec);

/**
 * Jest does a bad job with esm, so we mock the report generation with a CLI call here.
 */
async function generateReport(lhr) {
  // This isn't technically JSON anymore but it works for this test.
  const lhrString = JSON.stringify(lhr).replaceAll(`"`, `'`);
  const {stdout} = await execAsync(
    `node -e "import('lighthouse').then(m=>console.log(m.generateReport(${lhrString})))"`
  );
  return stdout;
}

jest.mock('lighthouse', () => ({generateReport}));

describe('#replaceUrlPatterns', () => {
  it('should replace basic patterns', () => {
    const patterns = ['s/foo/bar/'];
    expect(replaceUrlPatterns('https://foo.com', patterns)).toEqual('https://bar.com');
  });

  it('should replace multiple patterns', () => {
    const patterns = ['s/foo/bar/', 's/bar/baz/'];
    expect(replaceUrlPatterns('https://foo.com', patterns)).toEqual('https://baz.com');
  });

  it('should replace regex patterns', () => {
    const patterns = ['s/:\\d+/:PORT/'];
    expect(replaceUrlPatterns('http://localhost:3000', patterns)).toEqual('http://localhost:PORT');
  });

  it('should support regex flags', () => {
    expect(replaceUrlPatterns('localhost', ['s/lOcAlHoSt/pwned/'])).toEqual('localhost');
    expect(replaceUrlPatterns('localhost', ['s/lOcAlHoSt/pwned/i'])).toEqual('pwned');
    expect(replaceUrlPatterns('localhost', ['s/L/$/i'])).toEqual('$ocalhost');
    expect(replaceUrlPatterns('localhost', ['s/L/$/ig'])).toEqual('$oca$host');
  });

  it('should allow alternate control characters and backreferences', () => {
    const patterns = ['s#(//.*?)/.*$#$1/path-junk#'];
    expect(replaceUrlPatterns('http://localhost/adfj/ajfo/ae?jfoi=ajsd', patterns)).toEqual(
      'http://localhost/path-junk'
    );
  });

  it('should throw on invalid sequences', () => {
    expect(() => replaceUrlPatterns('foo', ['s/foo/bar'])).toThrow();
    expect(() => replaceUrlPatterns('foo', ['foo/bar'])).toThrow();
    expect(() => replaceUrlPatterns('foo', ['nothing'])).toThrow();
  });
});

describe('#getFinalUrl', () => {
  it('should return finalUrl when no hash is present', () => {
    expect(
      getFinalUrl({
        finalUrl: 'http://example.com/app/index.html',
        requestedUrl: 'http://example.com/app/index.html',
      })
    ).toEqual('http://example.com/app/index.html');
  });

  it('should preserve hash from requestedUrl on finalUrl', () => {
    expect(
      getFinalUrl({
        finalUrl: 'http://example.com/app/index.html',
        requestedUrl: 'http://example.com/app/index.html#/document/123',
      })
    ).toEqual('http://example.com/app/index.html#/document/123');
  });

  it('should apply hash from requestedUrl to a redirected finalUrl', () => {
    expect(
      getFinalUrl({
        finalUrl: 'https://example.com/app/',
        requestedUrl: 'http://example.com/app#/home',
      })
    ).toEqual('https://example.com/app/#/home');
  });

  it('should ignore a runtime hash on finalDisplayedUrl when requestedUrl has no hash', () => {
    /** @type {any} */
    const lhr = {
      finalUrl: 'http://example.com/app/index.html',
      finalDisplayedUrl: 'http://example.com/app/index.html#access_token=abc123',
      requestedUrl: 'http://example.com/app/index.html',
    };
    expect(getFinalUrl(lhr)).toEqual('http://example.com/app/index.html');
  });

  it('should fallback gracefully when urls are not parseable', () => {
    expect(getFinalUrl({finalUrl: 'foo.com', requestedUrl: 'foo.com'})).toEqual('foo.com');
    expect(getFinalUrl({finalUrl: 'foo.com', requestedUrl: 'http://foo.com/#/home'})).toEqual(
      'foo.com'
    );
  });
});

describe('#saveLHR', () => {
  it('should save the lhr to json', async () => {
    await withTmpDir(async dir => {
      await saveLHR(JSON.stringify({lighthouseVersion: '5.6.0'}), dir);
      const files = fs.readdirSync(dir);
      expect(files.map(name => name.replace(/-\d+/g, '-XXX'))).toContain('lhr-XXX-XXX.json');

      const jsonFilePath = path.join(
        dir,
        files.find(f => f.endsWith('.json'))
      );
      const contents = fs.readFileSync(jsonFilePath, 'utf8');
      expect(contents).toEqual(`{"lighthouseVersion":"5.6.0"}`);
    });
  });

  it('should save the lhr to html', async () => {
    await withTmpDir(async dir => {
      await saveLHR(JSON.stringify({lighthouseVersion: '5.6.0'}), dir);
      const files = fs.readdirSync(dir);
      expect(files.map(name => name.replace(/-\d+/g, '-XXX'))).toContain('lhr-XXX-XXX.html');

      const jsonFilePath = path.join(
        dir,
        files.find(f => f.endsWith('.html'))
      );
      const contents = fs.readFileSync(jsonFilePath, 'utf8');
      expect(contents).toMatch(/<!DOCTYPE html>/i);
      expect(contents).toMatch(/__LIGHTHOUSE_JSON__ = /);
    });
  });

  it('should not overwrite files saved in the same millisecond', async () => {
    await withTmpDir(async dir => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
      try {
        await saveLHR(JSON.stringify({lighthouseVersion: '5.6.0'}), dir);
        await saveLHR(JSON.stringify({lighthouseVersion: '5.6.0'}), dir);
      } finally {
        nowSpy.mockRestore();
      }

      const files = fs.readdirSync(dir);
      expect(files).toHaveLength(4);
    });
  });
});
