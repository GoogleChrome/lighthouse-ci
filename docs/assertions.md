# Assertions

## Usage

Configuring assertions for Lighthouse CI is most easily done through a `lighthouserc.json` file. While the file supports configuration for many different Lighthouse functions, the settings for your assertions will be found in the `ci.assert` property of your JSON file. For example,

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "uses-responsive-images": "error"
      }
    }
  }
}
```

The `ci.assert` wrapper will be left out of future code samples in this file to simplify the example.

### Audits

The result of any audit in Lighthouse can be asserted. Assertions are keyed by the Lighthouse audit ID and follow an eslint-style format of `level | [level, options]`. For a reference of the audit IDs in each category, you can take a look at the [default Lighthouse config](https://github.com/GoogleChrome/lighthouse/blob/v5.5.0/lighthouse-core/config/default-config.js#L375-L407). When no options are set, the default options of `{"aggregationMethod": "optimistic", "minScore": 1}` are used.

```json
{
  "assertions": {
    "first-contentful-paint": "off",
    "works-offline": ["warn", {"minScore": 1}],
    "uses-responsive-images": ["error", {"maxLength": 0}]
  }
}
```

### Categories

The score of any category in Lighthouse can also be asserted. Assertions are keyed by `categories:<categoryId>` and follow the same eslint-style format as audit assertions. Note that this just affects the _category score_ and will not affect any assertions on individual audits within the category.

```json
{
  "assertions": {
    "categories:performance": ["warn", {"minScore": 0.9}],
    "categories:accessibility": ["error", {"minScore": 1}]
  }
}
```

### Levels

There are three Lighthouse CI assertion levels.

- `off` - The audit result will not be checked. If an audit is not found in the `assertions` object, it is assumed to be `off`.
- `warn` - The audit result will be checked, and the result will be printed to stderr, but failure will not result in a non-zero exit code.
- `error` - The audit result will be checked, the result will be printed to stderr, and failure will result in a non-zero exit code.

### Properties

The `score`, `details.items.length`, and `numericValue` properties of audit results can all be checked against configurable thresholds. Use `minScore`, `maxLength`, and `maxNumericValue` properties, respectively, in the options object to control the assertion.

```json
{
  "assertions": {
    "audit-id-1": ["warn", {"maxNumericValue": 4000}],
    "audit-id-2": ["error", {"minScore": 0.8}],
    "audit-id-3": ["warn", {"maxLength": 0}]
  }
}
```

### Aggregation Methods

When checking the results of multiple Lighthouse runs, there are multiple strategies for aggregating the results before asserting the threshold.

- `median` - Use the median value from all runs.
- `optimistic` - Use the value that is most likely to pass from all runs.
- `pessimistic` - Use the value that is least likely to pass from all runs.
- `median-run` Use the value of the run that was determined to be "most representative" of all runs based on key performance metrics. Note that this differs from `median` because the audit you're asserting might not be the performance metric that was used to select the `median-run`.

### Multiple URLs / Assertion Matrix

When checking the results of runs against multiple URLs, different assertions can be made for different URL patterns.

The below example warns when FCP is above 2 seconds on _all_ pages and warns when TTI is above 5 seconds on all _secure_ pages _whose path starts with `/app`_. Assertion matrix configurations can be used to differentiate production from development, landing pages from single-page apps, and more.

```json
{
  "assertMatrix": [
    {
      "matchingUrlPattern": ".*",
      "assertions": {
        "first-contentful-paint": ["warn", {"maxNumericValue": 2000}]
      }
    },
    {
      "matchingUrlPattern": "https://[^/]+/app",
      "assertions": {
        "interactive": ["warn", {"maxNumericValue": 5000}]
      }
    }
  ]
}
```

## Presets

There are three presets available to provide a good starting point. Presets can be extended with manual assertions.

- `lighthouse:all` - Asserts that every audit received a perfect score. This is extremely difficult to do. Only use as a base on very high quality, greenfield projects and lower the tresholds as needed.
- `lighthouse:recommended` - Asserts that every audit outside performance received a perfect score, that no resources were flagged for performance opportunities, and warns when metric values drop below a score of `90`. This is a more realistic base that disables hard failures for flaky audits.
- `lighthouse:no-pwa` - `lighthouse:recommended` but without any of the PWA audits enabled.

The below example uses the `lighthouse:no-pwa` preset but disables a few audits we're not quite ready to pass yet and increases the limit on an audit with a `numericValue`.

```json
{
  "preset": "lighthouse:no-pwa",
  "assertions": {
    "dom-size": ["error", {"maxNumericValue": 3000}],
    "offscreen-images": "off",
    "color-contrast": "off",
    "tap-targets": "off"
  }
}
```

## Budgets

Instead of configuring using Lighthouse CI assertions against Lighthouse audits, a [budget.json](https://github.com/GoogleChrome/budget.json) file can be used instead. This option cannot be used in conjunction with any other option.

```json
{
  "budgetsFile": "path/from/cwd/to/budget.json"
}
```

If you'd like to consolidate multiple assertion configuration files and avoid multiple calls to `lhci assert`, you can also configure your budgets alongside your other Lighthouse CI assertions instead. Budget assertions follow the form `resource-summary:<resourceType>:(size|count)`.

```json
{
  "assertions": {
    "first-contentful-paint": ["warn", {"maxNumericValue": 4000}],
    "viewport": "error",
    "resource-summary:document:size": ["error", {"maxNumericValue": 400}],
    "resource-summary:font:count": ["warn", {"maxNumericValue": 1}],
    "resource-summary:third-party:count": ["warn", {"maxNumericValue": 5}]
  }
}
```
