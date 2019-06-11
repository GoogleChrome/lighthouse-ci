/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

/** @typedef {keyof Omit<LHCI.AssertCommand.AssertionOptions, 'mergeMethod'>|'auditRan'} AssertionType */

/**
 * @typedef AssertionResult
 * @property {AssertionType} name
 * @property {string} operator
 * @property {number} expected
 * @property {number} actual
 * @property {number[]} values
 * @property {LHCI.AssertCommand.AssertionFailureLevel} [level]
 * @property {string} [auditId]
 */

/** @type {Record<AssertionType, (result: LH.AuditResult) => number | undefined>} */
const AUDIT_TYPE_VALUE_GETTERS = {
  auditRan: result => (result === undefined ? 0 : 1),
  minScore: result => {
    if (typeof result.score === 'number') return result.score;
    if (result.scoreDisplayMode === 'notApplicable') return 1;
    if (result.scoreDisplayMode === 'informative') return 0;
    return undefined;
  },
  maxLength: result => result.details && result.details.items && result.details.items.length,
  maxNumericValue: result => result.numericValue,
};

/** @type {Record<AssertionType, {operator: string, passesFn(actual: number, expected: number): boolean}>} */
const AUDIT_TYPE_OPERATORS = {
  auditRan: {operator: '==', passesFn: (actual, expected) => actual === expected},
  minScore: {operator: '>=', passesFn: (actual, expected) => actual >= expected},
  maxLength: {operator: '<=', passesFn: (actual, expected) => actual <= expected},
  maxNumericValue: {operator: '<=', passesFn: (actual, expected) => actual <= expected},
};

/**
 * @param {any} x
 * @return {x is number}
 */
const isFiniteNumber = x => typeof x === 'number' && Number.isFinite(x);

/**
 * @param {LHCI.AssertCommand.AssertionFailureLevel | [LHCI.AssertCommand.AssertionFailureLevel, LHCI.AssertCommand.AssertionOptions] | undefined} assertion
 * @return {[LHCI.AssertCommand.AssertionFailureLevel, LHCI.AssertCommand.AssertionOptions]}
 */
function normalizeAssertion(assertion) {
  if (!assertion) return ['off', {}];
  if (typeof assertion === 'string') return [assertion, {}];
  return assertion;
}

/**
 * @param {number[]} values
 * @param {LHCI.AssertCommand.AssertionMergeMethod} mergeMethod
 * @param {AssertionType} assertionType
 * @return {number}
 */
function getValueForMergeMethod(values, mergeMethod, assertionType) {
  if (mergeMethod === 'median') {
    const medianIndex = Math.floor((values.length - 1) / 2);
    const sorted = values.slice().sort((a, b) => a - b);
    if (values.length % 2 === 1) return sorted[medianIndex];
    return (sorted[medianIndex] + sorted[medianIndex + 1]) / 2;
  }

  const useMin =
    (mergeMethod === 'optimistic' && assertionType.startsWith('max')) ||
    (mergeMethod === 'pessimistic' && assertionType.startsWith('min'));
  return useMin ? Math.min(...values) : Math.max(...values);
}

/**
 * @param {LH.AuditResult[]} auditResults
 * @param {LHCI.AssertCommand.AssertionMergeMethod} mergeMethod
 * @param {AssertionType} assertionType
 * @param {number} expectedValue
 * @return {AssertionResult[]}
 */
function getAssertionResult(auditResults, mergeMethod, assertionType, expectedValue) {
  const values = auditResults.map(AUDIT_TYPE_VALUE_GETTERS[assertionType]);
  const filteredValues = values.filter(isFiniteNumber);

  if (
    (!filteredValues.length && mergeMethod !== 'pessimistic') ||
    (filteredValues.length !== values.length && mergeMethod === 'pessimistic')
  ) {
    const didRun = values.map(value => (isFiniteNumber(value) ? 1 : 0));
    return [{name: 'auditRan', expected: 1, actual: 0, values: didRun, operator: '=='}];
  }

  const {operator, passesFn} = AUDIT_TYPE_OPERATORS[assertionType];
  const actualValue = getValueForMergeMethod(filteredValues, mergeMethod, assertionType);
  if (passesFn(actualValue, expectedValue)) return [];

  return [
    {
      name: assertionType,
      expected: expectedValue,
      actual: actualValue,
      values: filteredValues,
      operator,
    },
  ];
}

/**
 * @param {LH.Result[]} lhrs
 * @param {string} auditId
 * @param {LHCI.AssertCommand.AssertionOptions} options
 * @return {AssertionResult[]}
 */
function getAssertionResults(lhrs, auditId, options) {
  const {minScore, maxLength, maxNumericValue, mergeMethod = 'optimistic'} = options;
  const auditResults = lhrs.map(lhr => lhr.audits[auditId]);
  if (auditResults.some(result => result === undefined)) {
    return [
      {
        name: 'auditRan',
        expected: 1,
        actual: 0,
        values: auditResults.map(result => (result === undefined ? 0 : 1)),
        operator: '>=',
      },
    ];
  }

  /** @type {AssertionResult[]} */
  const results = [];

  // Keep track of if we had a manual assertion so we know whether or not to automatically create a
  // default minScore assertion.
  let hadManualAssertion = false;

  if (maxLength !== undefined) {
    hadManualAssertion = true;
    results.push(...getAssertionResult(auditResults, mergeMethod, 'maxLength', maxLength));
  }

  if (maxNumericValue !== undefined) {
    hadManualAssertion = true;
    results.push(
      ...getAssertionResult(auditResults, mergeMethod, 'maxNumericValue', maxNumericValue)
    );
  }

  const realMinScore = minScore === undefined && !hadManualAssertion ? 1 : minScore;
  if (realMinScore !== undefined) {
    results.push(...getAssertionResult(auditResults, mergeMethod, 'minScore', realMinScore));
  }

  return results;
}

/**
 * @param {LHCI.AssertCommand.Options} options
 * @param {LH.Result[]} lhrs
 * @return {AssertionResult[]}
 */
function getAllAssertionResults(options, lhrs) {
  const {preset = '', ...optionOverrides} = options;
  let optionsToUse = optionOverrides;
  const presetMatch = preset.match(/lighthouse:(.*)$/);
  if (presetMatch) {
    const presetData = require(`./presets/${presetMatch[1]}.js`);
    optionsToUse = _.merge(_.cloneDeep(presetData), optionsToUse);
  }

  const {assertions = {}} = optionsToUse;

  /** @type {AssertionResult[]} */
  const results = [];
  const auditsToAssert = new Set(Object.keys(assertions).map(_.kebabCase));
  for (const auditId of auditsToAssert) {
    const [level, assertionOptions] = normalizeAssertion(assertions[auditId]);
    if (level === 'off') continue;
    for (const result of getAssertionResults(lhrs, auditId, assertionOptions)) {
      results.push({...result, auditId, level});
    }
  }

  return results;
}

module.exports = {getAllAssertionResults};
