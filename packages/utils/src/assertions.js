/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');
const {computeRepresentativeRuns} = require('./representative-runs.js');

/** @typedef {keyof StrictOmit<LHCI.AssertCommand.AssertionOptions, 'aggregationMethod'>|'auditRan'} AssertionType */

/**
 * @typedef AssertionResult
 * @property {string} url
 * @property {AssertionType} name
 * @property {string} operator
 * @property {number} expected
 * @property {number} actual
 * @property {number[]} values
 * @property {LHCI.AssertCommand.AssertionFailureLevel} [level]
 * @property {string} [auditId]
 * @property {string|undefined} [auditProperty]
 */

/** @typedef {StrictOmit<AssertionResult, 'url'>} AssertionResultNoURL */

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
 * @param {LHCI.AssertCommand.AssertionAggregationMethod} aggregationMethod
 * @param {AssertionType} assertionType
 * @return {number}
 */
function getValueForAggregationMethod(values, aggregationMethod, assertionType) {
  if (aggregationMethod === 'median') {
    const medianIndex = Math.floor((values.length - 1) / 2);
    const sorted = values.slice().sort((a, b) => a - b);
    if (values.length % 2 === 1) return sorted[medianIndex];
    return (sorted[medianIndex] + sorted[medianIndex + 1]) / 2;
  }

  const useMin =
    (aggregationMethod === 'optimistic' && assertionType.startsWith('max')) ||
    (aggregationMethod === 'pessimistic' && assertionType.startsWith('min'));
  return useMin ? Math.min(...values) : Math.max(...values);
}

/**
 * @param {LH.AuditResult[]} auditResults
 * @param {LHCI.AssertCommand.AssertionAggregationMethod} aggregationMethod
 * @param {AssertionType} assertionType
 * @param {number} expectedValue
 * @return {AssertionResultNoURL[]}
 */
function getAssertionResult(auditResults, aggregationMethod, assertionType, expectedValue) {
  const values = auditResults.map(AUDIT_TYPE_VALUE_GETTERS[assertionType]);
  const filteredValues = values.filter(isFiniteNumber);

  if (
    (!filteredValues.length && aggregationMethod !== 'pessimistic') ||
    (filteredValues.length !== values.length && aggregationMethod === 'pessimistic')
  ) {
    const didRun = values.map(value => (isFiniteNumber(value) ? 1 : 0));
    return [{name: 'auditRan', expected: 1, actual: 0, values: didRun, operator: '=='}];
  }

  const {operator, passesFn} = AUDIT_TYPE_OPERATORS[assertionType];
  const actualValue = getValueForAggregationMethod(
    filteredValues,
    aggregationMethod,
    assertionType
  );
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
 * @param {Array<LH.AuditResult|undefined>} possibleAuditResults
 * @param {LHCI.AssertCommand.AssertionOptions} options
 * @return {AssertionResultNoURL[]}
 */
function getAssertionResults(possibleAuditResults, options) {
  const {minScore, maxLength, maxNumericValue, aggregationMethod = 'optimistic'} = options;
  if (possibleAuditResults.some(result => result === undefined)) {
    return [
      {
        name: 'auditRan',
        expected: 1,
        actual: 0,
        values: possibleAuditResults.map(result => (result === undefined ? 0 : 1)),
        operator: '>=',
      },
    ];
  }

  // We just checked that all of them are defined, so redefine for easier tsc.
  const auditResults = /** @type {Array<LH.AuditResult>} */ (possibleAuditResults);

  /** @type {AssertionResultNoURL[]} */
  const results = [];

  // Keep track of if we had a manual assertion so we know whether or not to automatically create a
  // default minScore assertion.
  let hadManualAssertion = false;

  if (maxLength !== undefined) {
    hadManualAssertion = true;
    results.push(...getAssertionResult(auditResults, aggregationMethod, 'maxLength', maxLength));
  }

  if (maxNumericValue !== undefined) {
    hadManualAssertion = true;
    results.push(
      ...getAssertionResult(auditResults, aggregationMethod, 'maxNumericValue', maxNumericValue)
    );
  }

  const realMinScore = minScore === undefined && !hadManualAssertion ? 1 : minScore;
  if (realMinScore !== undefined) {
    results.push(...getAssertionResult(auditResults, aggregationMethod, 'minScore', realMinScore));
  }

  return results;
}

/**
 * @param {string} key
 * @param {number} actual
 * @param {number} expected
 * @return {AssertionResultNoURL[]}
 */
function getAssertionResultsForBudgetRow(key, actual, expected) {
  return getAssertionResult(
    [{score: 0, numericValue: actual}],
    'pessimistic',
    'maxNumericValue',
    expected
  ).map(assertion => {
    return {...assertion, auditProperty: key};
  });
}

/**
 * Budgets are somewhat unique in that they are already asserted at collection time by Lighthouse.
 * We won't use any of our fancy logic here and we just want to pass on whatever Lighthouse found
 * by creating fake individual audit results to assert against for each individual table row
 * (de-duped by "<resource type>.<property>").
 *
 * @param {LH.AuditResult[]} auditResults
 * @return {AssertionResultNoURL[]}
 */
function getBudgetAssertionResults(auditResults) {
  /** @type {AssertionResultNoURL[]} */
  const results = [];
  /** @type {Set<string>} */
  const resultsKeys = new Set();

  for (const auditResult of auditResults) {
    if (!auditResult.details || !auditResult.details.items) continue;

    for (const budgetRow of auditResult.details.items) {
      const sizeKey = `${budgetRow.resourceType}.size`;
      const countKey = `${budgetRow.resourceType}.count`;

      if (budgetRow.sizeOverBudget && !resultsKeys.has(sizeKey)) {
        const actual = budgetRow.size;
        const expected = actual - budgetRow.sizeOverBudget;
        results.push(...getAssertionResultsForBudgetRow(sizeKey, actual, expected));
        resultsKeys.add(sizeKey);
      }

      if (budgetRow.countOverBudget && !resultsKeys.has(countKey)) {
        const actual = budgetRow.requestCount;
        const overBudgetMatch = budgetRow.countOverBudget.match(/\d+/);
        if (!overBudgetMatch) continue;
        const overBudget = Number(overBudgetMatch[0]) || 0;
        const expected = actual - overBudget;
        results.push(...getAssertionResultsForBudgetRow(countKey, actual, expected));
        resultsKeys.add(countKey);
      }
    }
  }

  return results;
}

/**
 * @param {string} pattern
 * @param {LH.Result} lhr
 * @return {boolean}
 */
function doesLHRMatchPattern(pattern, lhr) {
  return new RegExp(pattern).test(lhr.finalUrl);
}

/**
 * Gets the assertion results for a particular audit. This method delegates some of the unique
 * handling for budgets and auditProperty assertions as necessary.
 *
 * @param {string} auditId
 * @param {Array<string>|undefined} auditProperty
 * @param {Array<LH.AuditResult>} auditResults
 * @param {LHCI.AssertCommand.AssertionOptions} assertionOptions
 * @return {AssertionResultNoURL[]}
 */
function getAssertionResultsForAudit(auditId, auditProperty, auditResults, assertionOptions) {
  if (auditId === 'performance-budget') {
    return getBudgetAssertionResults(auditResults);
  } else if (auditId === 'resource-summary' && auditProperty) {
    if (auditProperty.length !== 2 || !['size', 'count'].includes(auditProperty[1])) {
      throw new Error(`Invalid resource-summary assertion "${auditProperty}"`);
    }

    const psuedoAuditResults = auditResults.map(result => {
      if (!result || !result.details || !result.details.items) return;
      const itemKey = auditProperty[1] === 'count' ? 'requestCount' : 'size';
      const item = result.details.items.find(item => item.resourceType === auditProperty[0]);
      if (!item) return;
      return {...result, numericValue: item[itemKey]};
    });

    return getAssertionResults(psuedoAuditResults, assertionOptions).map(result => ({
      ...result,
      auditProperty: auditProperty.join('.'),
    }));
  } else {
    return getAssertionResults(auditResults, assertionOptions);
  }
}

/**
 * @param {LHCI.AssertCommand.BaseOptions} baseOptions
 * @param {LH.Result[]} unfilteredLhrs
 */
function resolveAssertionOptionsAndLhrs(baseOptions, unfilteredLhrs) {
  const {preset = '', ...optionOverrides} = baseOptions;
  let optionsToUse = optionOverrides;
  const presetMatch = preset.match(/lighthouse:(.*)$/);
  if (presetMatch) {
    const presetData = require(`./presets/${presetMatch[1]}.js`);
    optionsToUse = _.merge(_.cloneDeep(presetData), optionsToUse);
  }

  const {assertions = {}, matchingUrlPattern: urlPattern, aggregationMethod} = optionsToUse;
  const lhrs = urlPattern
    ? unfilteredLhrs.filter(lhr => doesLHRMatchPattern(urlPattern, lhr))
    : unfilteredLhrs;

  // Double-check we've only got one URL to look at that should have been pre-grouped in `getAllAssertionResults`.
  const uniqueURLs = new Set(lhrs.map(lhr => lhr.finalUrl));
  if (uniqueURLs.size > 1) throw new Error('Can only assert one URL at a time!');

  const medianLhrs = computeRepresentativeRuns([
    lhrs.map(lhr => /** @type {[LH.Result, LH.Result]} */ ([lhr, lhr])),
  ]);

  const auditsToAssert = [...new Set(Object.keys(assertions).map(_.kebabCase))].map(
    assertionKey => {
      const [auditId, ...rest] = assertionKey.split('.');
      if (!rest.length) return {assertionKey, auditId};
      return {assertionKey, auditId, auditProperty: rest};
    }
  );

  return {
    assertions,
    auditsToAssert,
    medianLhrs,
    aggregationMethod,
    lhrs: lhrs,
    url: (lhrs[0] && lhrs[0].finalUrl) || '',
  };
}

/**
 * @param {LHCI.AssertCommand.BaseOptions} baseOptions
 * @param {LH.Result[]} unfilteredLhrs
 * @return {AssertionResult[]}
 */
function getAllFilteredAssertionResults(baseOptions, unfilteredLhrs) {
  const {
    assertions,
    auditsToAssert,
    medianLhrs,
    lhrs,
    url,
    aggregationMethod,
  } = resolveAssertionOptionsAndLhrs(baseOptions, unfilteredLhrs);

  // If we don't have any data, just return early.
  if (!lhrs.length) return [];

  /** @type {AssertionResult[]} */
  const results = [];

  for (const {assertionKey, auditId, auditProperty} of auditsToAssert) {
    const [level, assertionOptions] = normalizeAssertion(assertions[assertionKey]);
    if (level === 'off') continue;

    const options = {aggregationMethod, ...assertionOptions};
    const lhrsToUseForAudit = options.aggregationMethod === 'median-run' ? medianLhrs : lhrs;
    const auditResults = lhrsToUseForAudit.map(lhr => lhr.audits[auditId]);
    const assertionResults = getAssertionResultsForAudit(
      auditId,
      auditProperty,
      auditResults,
      options
    );

    for (const result of assertionResults) {
      results.push({...result, auditId, level, url});
    }
  }

  return results;
}

/**
 * @param {LHCI.AssertCommand.Options} options
 * @param {LH.Result[]} lhrs
 * @return {AssertionResult[]}
 */
function getAllAssertionResults(options, lhrs) {
  const groupedByURL = _.groupBy(lhrs, lhr => lhr.finalUrl);

  /** @type {LHCI.AssertCommand.BaseOptions[]} */
  let arrayOfOptions = [options];
  if (options.assertMatrix) {
    const {assertMatrix, ...restOptions} = options;
    if (Object.keys(restOptions).length) {
      throw new Error('Cannot use assertMatrix with other options');
    }

    arrayOfOptions = assertMatrix;
  }

  /** @type {AssertionResult[]} */
  const results = [];
  for (const lhrSet of groupedByURL) {
    for (const baseOptions of arrayOfOptions) {
      results.push(...getAllFilteredAssertionResults(baseOptions, lhrSet));
    }
  }

  return results;
}

module.exports = {getAllAssertionResults};
