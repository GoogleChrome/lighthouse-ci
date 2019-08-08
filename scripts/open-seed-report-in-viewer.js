#!/usr/bin/env node
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const puppeteer = require('puppeteer');
const {RUNS} = require('../src/shared/seed-data.js');

async function run() {
  const browser = await puppeteer.launch({headless: false, devtools: true});
  const page = await browser.newPage();
  await page.goto('https://googlechrome.github.io/lighthouse/viewer/');
  await page.evaluate(() => console.log('Loaded'));
  await page.waitFor(1000);
  await page.evaluate(() => console.log('Evaling'));
  await page.evaluate(lhr => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text', lhr);
    const event = new ClipboardEvent('paste', {clipboardData: dataTransfer});
    document.dispatchEvent(event);
    window.__event = event;
  }, RUNS[0].lhr);

  console.log(JSON.stringify(JSON.parse(RUNS[0].lhr), null, 2));
}

run();
