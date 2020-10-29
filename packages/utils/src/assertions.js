/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');
const preset = require('./presets/all.js');
const {splitMarkdownLink} = require('./markdown.js');
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
 * @property {boolean} passed
 * @property {LHCI.AssertCommand.AssertionFailureLevel} [level]
 * @property {string} [auditId]
 * @property {string|undefined} [auditProperty]
 * @property {string|undefined} [auditTitle]
 * @property {string|undefined} [auditDocumentationLink]
 * @property {string|undefined} [message]
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
  maxLength: result => (result.details && result.details.items && result.details.items.length) || 0,
  maxNumericValue: result => result.numericValue,
};

/** @type {Record<AssertionType, {operator: string, passedFn(actual: number, expected: number): boolean}>} */
const AUDIT_TYPE_OPERATORS = {
  auditRan: {operator: '==', passedFn: (actual, expected) => actual === expected},
  minScore: {operator: '>=', passedFn: (actual, expected) => actual >= expected},
  maxLength: {operator: '<=', passedFn: (actual, expected) => actual <= expected},
  maxNumericValue: {operator: '<=', passedFn: (actual, expected) => actual <= expected},
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
  const {operator, passedFn} = AUDIT_TYPE_OPERATORS[assertionType];

  if (
    (!filteredValues.length && aggregationMethod !== 'pessimistic') ||
    (filteredValues.length !== values.length && aggregationMethod === 'pessimistic')
  ) {
    /** @type {string|undefined} */
    let message = undefined;
    if (values.some(v => v === undefined)) {
      const userAction = `"${assertionType}" might not be a valid assertion for this audit.`;
      message = `Audit did not produce a value at all. ${userAction}`;
    } else {
      const userAction =
        aggregationMethod === 'pessimistic'
          ? 'Try using an aggregationMethod other than "pessimistic".'
          : 'If this is reproducible, please file an issue on GitHub.';
      message = `Audit failed to produce a valid value. ${userAction}`;
    }

    const didRun = values.map(value => (isFiniteNumber(value) ? value : NaN));

    return [
      {
        name: assertionType,
        expected: expectedValue,
        actual: NaN,
        values: didRun,
        operator,
        passed: false,
        message,
      },
    ];
  }

  const actualValue = getValueForAggregationMethod(
    filteredValues,
    aggregationMethod,
    assertionType
  );

  return [
    {
      name: assertionType,
      expected: expectedValue,
      actual: actualValue,
      values: filteredValues,
      operator,
      passed: passedFn(actualValue, expectedValue),
    },
  ];
}

/**
 * @param {Array<LH.AuditResult|undefined>} possibleAuditResults
 * @param {LHCI.AssertCommand.AssertionOptions} options
 * @param {string} [auditId]
 * @return {AssertionResultNoURL[]}
 */
function getStandardAssertionResults(possibleAuditResults, options, auditId) {
  const {minScore, maxLength, maxNumericValue, aggregationMethod = 'optimistic'} = options;
  if (possibleAuditResults.some(result => result === undefined)) {
    return [
      {
        name: 'auditRan',
        expected: 1,
        actual: 0,
        values: possibleAuditResults.map(result => (result === undefined ? 0 : 1)),
        operator: '>=',
        passed: false,
        message:
          auditId && !(auditId in preset.assertions)
            ? `"${auditId}" is not a known audit.`
            : undefined,
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

  const realMinScore = minScore === undefined && !hadManualAssertion ? 0.9 : minScore;
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
    if (!auditResult) continue;
    if (!auditResult.details || !auditResult.details.items) continue;

    for (const budgetRow of auditResult.details.items) {
      const sizeKey = `${budgetRow.resourceType}.size`;
      const countKey = `${budgetRow.resourceType}.count`;

      if (budgetRow.sizeOverBudget && !resultsKeys.has(sizeKey)) {
        const actual = budgetRow.size || budgetRow.transferSize;
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
 * Gets the assertion results for a particular audit. This method delegates some of the unique
 * handling for budgets and auditProperty assertions as necessary.
 *
 * @param {Array<string>} auditProperty
 * @param {LHCI.AssertCommand.AssertionOptions} assertionOptions
 * @param {Array<LH.Result>} lhrs
 * @return {AssertionResultNoURL[]}
 */
function getCategoryAssertionResults(auditProperty, assertionOptions, lhrs) {
  if (auditProperty.length !== 1) {
    throw new Error(`Invalid resource-summary assertion "${auditProperty.join('.')}"`);
  }

  const categoryId = auditProperty[0];

  /** @type {Array<LH.AuditResult|undefined>} */
  const psuedoAudits = lhrs.map(lhr => {
    const category = lhr.categories[categoryId];
    if (!category) return undefined;

    return {
      score: category.score,
    };
  });

  return getStandardAssertionResults(psuedoAudits, assertionOptions).map(result => ({
    ...result,
    auditProperty: categoryId,
  }));
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
 * @param {Array<LH.Result>} lhrs
 * @return {AssertionResultNoURL[]}
 */
function getAssertionResultsForAudit(auditId, auditProperty, auditResults, assertionOptions, lhrs) {
  if (auditId === 'performance-budget') {
    return getBudgetAssertionResults(auditResults);
  } else if (auditId === 'categories' && auditProperty) {
    return getCategoryAssertionResults(auditProperty, assertionOptions, lhrs);
  } else if (auditId === 'resource-summary' && auditProperty) {
    if (auditProperty.length !== 2 || !['size', 'count'].includes(auditProperty[1])) {
      throw new Error(`Invalid resource-summary assertion "${auditProperty.join('.')}"`);
    }

    const psuedoAuditResults = auditResults.map(result => {
      if (!result || !result.details || !result.details.items) return;
      const item = result.details.items.find(item => item.resourceType === auditProperty[0]);
      if (!item) return;

      const primaryItemKey = auditProperty[1] === 'size' ? 'size' : 'requestCount';
      const backupItemKey = auditProperty[1] === 'size' ? 'transferSize' : '';
      const itemKey = primaryItemKey in item ? primaryItemKey : backupItemKey;
      if (!(itemKey in item)) return;
      return {...result, numericValue: item[itemKey]};
    });

    return getStandardAssertionResults(psuedoAuditResults, assertionOptions).map(result => ({
      ...result,
      auditProperty: auditProperty.join('.'),
    }));
  } else if (auditId === 'user-timings' && auditProperty) {
    const userTimingName = _.kebabCase(auditProperty.join('-'), {alphanumericOnly: true});
    const psuedoAuditResults = auditResults.map(result => {
      if (!result || !result.details || !result.details.items) return;
      const item = result.details.items.find(
        item => _.kebabCase(item.name, {alphanumericOnly: true}) === userTimingName
      );
      if (!item) return;
      const numericValue = Number.isFinite(item.duration) ? item.duration : item.startTime;
      return {...result, numericValue};
    });

    return getStandardAssertionResults(psuedoAuditResults, assertionOptions).map(result => ({
      ...result,
      auditProperty: userTimingName,
    }));
  } else {
    return getStandardAssertionResults(auditResults, assertionOptions, auditId);
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

  const auditsToAssert = [...new Set(Object.keys(assertions).map(key => _.kebabCase(key)))].map(
    assertionKey => {
      const [auditId, ...rest] = assertionKey.split(/\.|:/g).filter(Boolean);
      const auditInstances = lhrs.map(lhr => lhr.audits[auditId]).filter(Boolean);
      const failedAudit = auditInstances.find(audit => audit.score !== 1);
      const audit = failedAudit || auditInstances[0] || {};
      const auditTitle = audit.title;
      const auditDocumentationLinkMatches = splitMarkdownLink(audit.description || '')
        .map(segment => (segment.isLink ? segment.linkHref : ''))
        .filter(link => link.includes('web.dev') || link.includes('developers.google.com/web'));
      const [auditDocumentationLink] = auditDocumentationLinkMatches;
      if (!rest.length) return {assertionKey, auditId, auditTitle, auditDocumentationLink};
      return {assertionKey, auditId, auditTitle, auditDocumentationLink, auditProperty: rest};
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
function getAllAssertionResultsForUrl(baseOptions, unfilteredLhrs) {
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

  for (const auditToAssert of auditsToAssert) {
    const {assertionKey, auditId, auditProperty} = auditToAssert;
    const [level, assertionOptions] = normalizeAssertion(assertions[assertionKey]);
    if (level === 'off') continue;

    const options = {aggregationMethod, ...assertionOptions};
    const lhrsToUseForAudit = options.aggregationMethod === 'median-run' ? medianLhrs : lhrs;
    const auditResults = lhrsToUseForAudit.map(lhr => lhr.audits[auditId]);
    const assertionResults = getAssertionResultsForAudit(
      auditId,
      auditProperty,
      auditResults,
      options,
      lhrs
    );

    for (const result of assertionResults) {
      const finalResult = {...result, auditId, level, url};
      if (auditToAssert.auditTitle) finalResult.auditTitle = auditToAssert.auditTitle;
      if (auditToAssert.auditDocumentationLink) {
        finalResult.auditDocumentationLink = auditToAssert.auditDocumentationLink;
      }

      results.push(finalResult);
    }
  }

  return results;
}

/**
 * Computes all assertion results for the given LHR-set and options.
 *
 * @param {LHCI.AssertCommand.Options} options
 * @param {LH.Result[]} lhrs
 * @return {AssertionResult[]}
 */
function getAllAssertionResults(options, lhrs) {
  const groupedByURL = _.groupBy(lhrs, lhr => lhr.finalUrl);

  /** @type {LHCI.AssertCommand.BaseOptions[]} */
  let arrayOfOptions = [options];
  if (options.assertMatrix) {
    if (options.assertions || options.preset || options.budgetsFile || options.aggregationMethod) {
      throw new Error('Cannot use assertMatrix with other options');
    }

    arrayOfOptions = options.assertMatrix;
  }

  /** @type {AssertionResult[]} */
  const results = [];
  for (const lhrSet of groupedByURL) {
    for (const baseOptions of arrayOfOptions) {
      results.push(...getAllAssertionResultsForUrl(baseOptions, lhrSet));
    }
  }

  if (options.includePassedAssertions) return results;
  return results.filter(result => !result.passed);
}

module.exports = {getAllAssertionResults};
