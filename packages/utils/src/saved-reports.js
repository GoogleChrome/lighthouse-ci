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
const ASSERTION_RESULTS_PATH = path.join(LHCI_DIR, 'assertion-results.json');

function ensureDirectoryExists() {
  if (!fs.existsSync(LHCI_DIR)) fs.mkdirSync(LHCI_DIR);
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
function saveLHR(lhr) {
  const filename = `lhr-${Date.now()}.json`;
  const filePath = path.join(LHCI_DIR, filename);
  ensureDirectoryExists();
  fs.writeFileSync(filePath, lhr);
}

/**
 * @param {LH.Result} lhr
 * @return {string}
 */
function getHTMLReportForLHR(lhr) {
  // @ts-ignore - lighthouse doesn't publish .d.ts files yet
  const ReportGenerator = require('lighthouse/lighthouse-core/report/report-generator.js');
  return ReportGenerator.generateReportHtml(lhr);
}

function clearSavedLHRs() {
  ensureDirectoryExists();
  for (const file of fs.readdirSync(LHCI_DIR)) {
    if (!LHR_REGEX.test(file)) continue;

    const filePath = path.join(LHCI_DIR, file);
    fs.unlinkSync(filePath);
  }
}

function getSavedReportsDirectory() {
  ensureDirectoryExists();
  return LHCI_DIR;
}

/** @return {Array<import('./assertions').AssertionResult>} */
function loadAssertionResults() {
  ensureDirectoryExists();
  if (!fs.existsSync(ASSERTION_RESULTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(ASSERTION_RESULTS_PATH, 'utf8'));
}

/** @param {Array<import('./assertions').AssertionResult>} results */
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

module.exports = {
  getHTMLReportForLHR,
  loadSavedLHRs,
  saveLHR,
  clearSavedLHRs,
  loadAssertionResults,
  saveAssertionResults,
  getSavedReportsDirectory,
  replaceUrlPatterns,
};
