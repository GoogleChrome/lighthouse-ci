/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const LHCI_DIR = path.join(process.cwd(), '.lighthouseci');
const LHR_REGEX = /^lhr-\d+\.json$/;
const LH_HTML_REPORT_REGEX = /^lhr-\d+\.html$/;
const ASSERTION_RESULTS_PATH = path.join(LHCI_DIR, 'assertion-results.json');
const URL_LINK_MAP_PATH = path.join(LHCI_DIR, 'links.json');

function ensureDirectoryExists(baseDir = LHCI_DIR) {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive: true});
}

/**
 * @return {string[]}
 */
function loadSavedLHRs() {
  ensureDirectoryExists();

  /** @type {string[]} */
  const lhrs = [];
  for (const file of fs.readdirSync(LHCI_DIR)) {
    if (!LHR_REGEX.test(file)) continue;

    const filePath = path.join(LHCI_DIR, file);
    lhrs.push(fs.readFileSync(filePath, 'utf8'));
  }

  return lhrs;
}

/**
 * @param {string} lhr
 */
async function saveLHR(lhr, baseDir = LHCI_DIR) {
  const baseFilename = `lhr-${Date.now()}`;
  const basePath = path.join(baseDir, baseFilename);
  ensureDirectoryExists(baseDir);
  fs.writeFileSync(`${basePath}.json`, lhr);
  fs.writeFileSync(`${basePath}.html`, await getHTMLReportForLHR(JSON.parse(lhr)));
}

/**
 * @param {LH.Result} lhr
 * @return {Promise<string>}
 */
async function getHTMLReportForLHR(lhr) {
  const {generateReport} = await import('lighthouse');
  // @ts-expect-error TODO: Import exact types from Lighthouse.
  return generateReport(lhr);
}

function clearSavedReportsAndLHRs() {
  ensureDirectoryExists();
  for (const file of fs.readdirSync(LHCI_DIR)) {
    if (!LHR_REGEX.test(file) && !LH_HTML_REPORT_REGEX.test(file)) continue;

    const filePath = path.join(LHCI_DIR, file);
    fs.unlinkSync(filePath);
  }
}

function getSavedReportsDirectory() {
  ensureDirectoryExists();
  return LHCI_DIR;
}

/** @return {Array<LHCI.AssertResults.AssertionResult>} */
function loadAssertionResults() {
  ensureDirectoryExists();
  if (!fs.existsSync(ASSERTION_RESULTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(ASSERTION_RESULTS_PATH, 'utf8'));
}

/** @param {Array<LHCI.AssertResults.AssertionResult>} results */
function saveAssertionResults(results) {
  ensureDirectoryExists();
  return fs.writeFileSync(ASSERTION_RESULTS_PATH, JSON.stringify(results, null, 2));
}

/**
 * @param {string} url
 * @param {string[]} sedLikeReplacementPatterns
 */
function replaceUrlPatterns(url, sedLikeReplacementPatterns) {
  let replaced = url;

  for (const pattern of sedLikeReplacementPatterns) {
    const match = pattern.match(/^s(.)(.*)\1(.*)\1([gim]*)$/);
    if (!match) throw new Error(`Invalid URL replacement pattern "${pattern}"`);
    const [needle, replacement, flags] = match.slice(2);
    const regex = new RegExp(needle, flags);
    replaced = replaced.replace(regex, replacement);
  }

  return replaced;
}

/**
 * @param {Map<string, string>} targetUrlMap
 */
function writeUrlMapToFile(targetUrlMap) {
  /** @type {Record<string, string>} */
  const urlMapAsObject = {};

  for (const [testedUrl, link] of targetUrlMap.entries()) {
    urlMapAsObject[testedUrl] = link;
  }

  fs.writeFileSync(URL_LINK_MAP_PATH, JSON.stringify(urlMapAsObject, null, 2));
}

module.exports = {
  getHTMLReportForLHR,
  loadSavedLHRs,
  saveLHR,
  clearSavedReportsAndLHRs,
  loadAssertionResults,
  saveAssertionResults,
  getSavedReportsDirectory,
  replaceUrlPatterns,
  writeUrlMapToFile,
};
