/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const fullPreset = require('@lhci/utils/src/presets/all.js');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI upload filesystem reports with url hash', () => {
  const uploadDir = path.join(__dirname, 'fixtures/uploads-url-hash');
  const lighthouseciDir = path.join(uploadDir, '.lighthouseci');
  const fakeLhrPath = path.join(lighthouseciDir, 'lhr-12345.json');

  const writeLhr = () => {
    const fakeLhr = {finalUrl: 'foo.com', categories: {}, audits: {}};
    fakeLhr.categories.pwa = {score: 0};
    fakeLhr.categories.performance = {score: 0};
    fakeLhr.audits['performance-budget'] = {score: 0};
    for (const key of Object.keys(fullPreset.assertions)) {
      fakeLhr.audits[key] = {score: 1, numericValue: 1000, details: {items: [{}]}};
    }

    fs.writeFileSync(fakeLhrPath, JSON.stringify(fakeLhr));
  };

  beforeAll(async () => {
    if (fs.existsSync(lighthouseciDir)) rimraf.sync(lighthouseciDir);
    if (!fs.existsSync(lighthouseciDir)) fs.mkdirSync(lighthouseciDir, {recursive: true});
    writeLhr();
  });

  // Added unit test for PR#835
  it('url with hash in the reportFilenamePattern', async () => {
    const lhr = JSON.parse(fs.readFileSync(fakeLhrPath, 'utf8'));
    lhr.requestedUrl = `https://www.example.com/#/page1`;
    lhr.fetchTime = '2022-10-25T22:34:01.000Z';
    lhr.categories.performance = {score: 0.5};
    lhr.audits['first-contentful-paint'].numericValue = 900;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-4'), JSON.stringify(lhr));

    lhr.requestedUrl = `https://www.example.com/#/page2`;
    lhr.fetchTime = '2022-10-25T22:34:02.000Z';
    lhr.categories.performance = {score: 0.5};
    lhr.audits['first-contentful-paint'].numericValue = 1100;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-5'), JSON.stringify(lhr));

    lhr.requestedUrl = `https://www.example.com/#/page3`;
    lhr.fetchTime = '2022-10-25T22:34:03.000Z';
    lhr.categories.performance = {score: 0.5};
    lhr.audits['first-contentful-paint'].numericValue = 1000;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-6'), JSON.stringify(lhr));
    fs.unlinkSync(fakeLhrPath);

    const {stdout, stderr, status} = await runCLI(
      [
        'upload',
        `--target=filesystem`,
        `--outputDir=.lighthouseci/targethashfs`,
        `--reportFilenamePattern='%%HOSTNAME%%-%%PATHNAME%%-%%HASH%%-%%DATETIME%%.report.%%EXTENSION%%'`,
      ],
      {cwd: uploadDir}
    );

    expect(stdout.replace(/at .*\.\.\./, 'at FOLDER...')).toMatchInlineSnapshot(`
      "Dumping 3 reports to disk at FOLDER...
      Done writing reports to disk.
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);

    const outputDir = path.join(uploadDir, '.lighthouseci/targethashfs');
    const files = fs.readdirSync(outputDir).sort();
    expect(files).toEqual([
      'manifest.json',
      'www_example_com-_-_page1-2022_10_25_22_34_01.report.html',
      'www_example_com-_-_page1-2022_10_25_22_34_01.report.json',
      'www_example_com-_-_page2-2022_10_25_22_34_02.report.html',
      'www_example_com-_-_page2-2022_10_25_22_34_02.report.json',
      'www_example_com-_-_page3-2022_10_25_22_34_03.report.html',
      'www_example_com-_-_page3-2022_10_25_22_34_03.report.json',
    ]);

    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'));
    expect(manifest).toEqual([
      {
        url: 'https://www.example.com/#/page1',
        isRepresentativeRun: true,
        htmlPath: path.join(outputDir, 'www_example_com-_-_page1-2022_10_25_22_34_01.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_-_page1-2022_10_25_22_34_01.report.json'),
        summary: {performance: 0.5, pwa: 0},
      },
      {
        url: 'https://www.example.com/#/page2',
        isRepresentativeRun: true,
        htmlPath: path.join(outputDir, 'www_example_com-_-_page2-2022_10_25_22_34_02.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_-_page2-2022_10_25_22_34_02.report.json'),
        summary: {performance: 0.5, pwa: 0},
      },
      {
        url: 'https://www.example.com/#/page3',
        isRepresentativeRun: true,
        htmlPath: path.join(outputDir, 'www_example_com-_-_page3-2022_10_25_22_34_03.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_-_page3-2022_10_25_22_34_03.report.json'),
        summary: {performance: 0.5, pwa: 0},
      },
    ]);
  }, 15000);
});
