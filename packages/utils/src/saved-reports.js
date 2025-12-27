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

/**
 * Escape special characters in a string to be used in a RegExp as a literal.
 * This mirrors lodash's _.escapeRegExp behavior.
 * @param {string} string
 * @return {string}
 */
function escapeRegExp(string) {
  return string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function ensureDirectoryExists(baseDir = LHCI_DIR) {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive: true});
}

/**
 * @param {string} [directoryOrPath]
 * @return {string[]}
 */
function loadSavedLHRs(directoryOrPath) {
  directoryOrPath = directoryOrPath || LHCI_DIR;

  if (directoryOrPath === LHCI_DIR) {
    ensureDirectoryExists();
  }

  if (fs.lstatSync(directoryOrPath).isFile()) {
    return [fs.readFileSync(directoryOrPath, 'utf8')];
  }

  /** @type {string[]} */
  const lhrs = [];
  for (const file of fs.readdirSync(directoryOrPath)) {
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
    // sed-like syntax: s<delim>needle<delim>replacement<delim>[flags]
    // Supports standard JS flags g/i/m and an optional custom flag "L"
    // which makes the pattern literal (needle is escaped before use).
    const match = pattern.match(/^s(.)(.*)\1(.*)\1([gimL]*)$/);
    if (!match) throw new Error(`Invalid URL replacement pattern "${pattern}"`);
    let [needle, replacement, flags] = match.slice(2);

    const flagChars = flags.split('');
    const literalIndex = flagChars.indexOf('L');
    const isLiteral = literalIndex !== -1;
    if (isLiteral) flagChars.splice(literalIndex, 1);

    const allowedFlags = ['g', 'i', 'm'];
    const seen = new Set();
    for (const flag of flagChars) {
      if (!allowedFlags.includes(flag) || seen.has(flag)) {
        throw new Error(`Invalid flags in URL replacement pattern "${pattern}"`);
      }
      seen.add(flag);
    }
    const finalFlags = flagChars.join('');

    if (isLiteral) {
      needle = escapeRegExp(needle);
    }

    const regex = new RegExp(needle, finalFlags);
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
