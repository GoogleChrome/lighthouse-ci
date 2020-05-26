# Configuration

## Overview

Lighthouse CI configuration can be managed through a config file, environment variables, and CLI flag overrides.

### Configuration File

Lighthouse CI will automatically look for a configuration file in the current working directory in the following priority order:

1. `.lighthouserc.js`
1. `lighthouserc.js`
1. `.lighthouserc.json`
1. `lighthouserc.json`
1. `.lighthouserc.yml`
1. `lighthouserc.yml`
1. `.lighthouserc.yaml`
1. `lighthouserc.yaml`

Note that upward traversal is not supported. If you'd like to keep your lighthouse configuration in a different location, you can explicitly pass in a configuration file path to any `lhci` command using `--config=./path/to/file`.

### Environment Variables

Any configuration option can also be set using environment variables prefixed with `LHCI_`, following the [yargs API](https://github.com/yargs/yargs/blob/v12.0.5/docs/api.md#envprefix) (so `LHCI_PROPERTY_NAME__SUBPROPERTY_NAME` is equivalent to `--propertyName.subpropertyName`).

```bash
LHCI_SERVER_BASE_URL=https://example.com lhci upload
# is equivalent to...
lhci upload --serverBaseUrl=https://example.com
```

### CLI Flags

Of course CLI flags can set options as well in addition to nested properties!

```bash
lhci assert --preset=lighthouse:recommended --assertions.uses-webp-images=off
```

## File Structure

The structure of the config file is segmented by command. Any options you see for a particular command can be set by the property of the same name in the config file.

**`lighthouserc.js`:**

```js
module.exports = {
  ci: {
    collect: {
      // collect options here
    },
    assert: {
      // assert options here
    },
    upload: {
      // upload options here
    },
    server: {
      // server options here
    },
    wizard: {
      // wizard options here
    },
  },
};
```

**`lighthouserc.json`:**

```json
{
  "ci": {
    "collect": {
      // collect options here
    },
    "assert": {
      // assert options here
    },
    "upload": {
      // upload options here
    },
    "server": {
      // server options here
    },
    "wizard": {
      // wizard options here
    }
  }
}
```

**`lighthouserc.yml`:**

```yml
ci:
  collect:
    # collect options here

  assert:
    # assert options here

  upload:
    # upload options here

  server:
    # server options here

  wizard:
    # wizard options here
```

## Commands

- [`healthcheck`](#healthcheck)
- [`autorun`](#autorun)
- [`collect`](#collect)
- [`upload`](#upload)
- [`assert`](#assert)
- [`open`](#open)
- [`wizard`](#wizard)
- [`server`](#server)

### Global Options

```txt
  --help             Show help                                         [boolean]
  --version          Show version number                               [boolean]
  --no-lighthouserc  Disables automatic usage of a .lighthouserc file. [boolean]
  --config           Path to JSON config file.
```

---

### `healthcheck`

Runs diagnostics to ensure a valid configuration, useful when setting up Lighthouse CI for the first time to test your configuration.

```bash
Options:
  --fatal            Exit with a non-zero status code when a component fails the status check.
                                                                                           [boolean]
  --checks           The list of opt-in checks to include in the fatality check.             [array]
```

**Examples**

```bash
lhci healthcheck --fatal --checks=githubToken
```

---

### `autorun`

Automatically run, with sensible defaults, [`lhci collect`](#collect), [`lhci assert`](#assert) and [`lhci upload`](#upload), depending on the options in your config. `lhci autorun` does not have any specific options for itself. Options for individual commands can be set by prefixing the option with the command name.

**Examples**

```bash
lhci autorun --collect.numberOfRuns=5
lhci autorun --upload.target=temporary-public-storage
```

#### Detecting `collect.staticDistDir`

Autorun will attempt to automatically detect the directory of your static site files. If you're using a popular framework like gatsby, create-react-app, etc, then you shouldn't need to take any action. `lhci autorun` will look for HTML files in the directories in the following order:

- `dist` (default name for vue-cli, parcel, and webpack)
- `build` (default name for create-react-app and preact-cli)
- `public` (default name for gatsby)

If your productionized static assets live in a different folder, you'd like to run Lighthouse CI on a specific subset of your static pages, your project does not use a build step at all or a different server, see the [`lhci collect` documentation](#collect) for how to configure your project.

#### Detecting `collect.startServerCommand`

If no `staticDistDir` could be automatically detected, autorun will attempt to automatically detect the `collect.startServerCommand` based on our `package.json`. To allow autorun to automatically start your webserver, add an npm script named `serve:lhci`.

example `package.json` excerpt:

```json
{
  "scripts": {
    "serve:lhci": "NODE_ENV=production npm run server"
  }
}
```

---

### `collect`

Runs Lighthouse n times and stores the LHRs in a local `.lighthouseci/` folder.

```bash
Options:
  --method                                              [string] [choices: "node"] [default: "node"]
  --headful                  Run with a headful Chrome                                     [boolean]
  --additive                 Skips clearing of previous collect data                       [boolean]
  --url                      A URL to run Lighthouse on. Use this flag multiple times to evaluate
                             multiple URLs.
  --staticDistDir            The build directory where your HTML files to run Lighthouse on are
                             located.
  --isSinglePageApplication  If the application is created by Single Page Application, enable
                             redirect to index.html.
  --chromePath               The path to the Chrome or Chromium executable to use for collection.
             [default: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"]
  --puppeteerScript          The path to a script that manipulates the browser with puppeteer before
                             running Lighthouse, used for auth.
  --puppeteerLaunchOptions   The object of puppeteer launch options
  --startServerCommand       The command to run to start the server.
  --startServerReadyPattern  String pattern to listen for started server.
                                                                  [string] [default: "listen|ready"]
  --startServerReadyTimeout  The number of milliseconds to wait for the server to start before
                             continuing                                    [number] [default: 10000]
  --settings                 The Lighthouse settings and flags to use when collecting
  --numberOfRuns, -n         The number of times to run Lighthouse.            [number] [default: 3]
```

#### `method`

The method used to run Lighthouse. There is currently only a single option available, `"node"` which runs Lighthouse locally via `node`.

#### `headful`

Boolean that controls whether Chrome is launched in headless or headful mode. This flag does not apply when using `puppeteerScript`.

#### `additive`

Boolean that controls whether the `.lighthouseci` directory is cleared before starting. By default, this directory is cleared on every invocation of `lhci collect` to start fresh.

#### `url`

An array of the URLs that you'd like Lighthouse CI to collect results from.

**When used with `staticDistDir`:**

- Automatic detection of URLs based on HTML files on disk will be disabled.
- URLs will have their port replaced with the port of the local server that Lighthouse CI starts for you. This allows you to write URLs as `http://localhost/my-static-page.html` without worrying about the chosen temporary port.

**When used without `staticDistDir`:**

- URLs will be used as-is without modification.

#### `staticDistDir`

The path to the directory where the project's productionized static assets are kept. Lighthouse CI uses this to spin up a static server on your behalf that will be used to load your site.

Use this option when the project is a static website to be hosted locally that does not require a separate server. **DO NOT** use this option if `url` will point to an origin that isn't `localhost` or the project uses `startServerCommand` to start a separate server.

#### `isSinglePageApplication`

Boolean that controls whether the static server started in `staticDistDir` should act like a single-page application that serves `index.html` instead of a 404 for unrecognized paths. This flag has no function when `staticDistDir` is not set.

#### `chromePath`

The path of the Chrome executable to use for `puppeteerScript` and running Lighthouse. Lighthouse CI will use Chrome installations in the following priority order:

- `chromePath` option
- `CHROME_PATH` Environment Variable
- Executable path returned by `puppeteer` or `puppeteer-core`, if installed.
- Highest priority installation returned by the `chrome-launcher` npm package.

#### `puppeteerScript`

An optional path to a JavaScript file that exports a function that uses puppeteer to login to your page, setup cache data, or otherwise manipulate the browser before Lighthouse is run.

**NOTE:** In order to use puppeteer scripts, you need to install `puppeteer` yourself, i.e. `npm install --save puppeteer`. Any version you like that has a `.launch` method compatible with v1.x or v2.x and works with the Chrome version installed in your environment should work.

When running Lighthouse CI on a page with behind authentication, you'll need to authorize the browser that Lighthouse CI will be using. While there are [several](./configuration.md#page-behind-authentication) different [options](https://github.com/GoogleChrome/lighthouse/blob/v5.6.0/docs/authenticated-pages.md) to accomplish this, the `puppeteerScript` option is one of the most flexible and convenient.

**Example `puppeteer-script.js`**

```js
/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/login');
  await page.type('#username', 'admin');
  await page.type('#password', 'password');
  await page.click('[type="submit"]');
  await page.waitForNavigation();
};
```

Lighthouse CI will then use the browser that this script sets up when running Lighthouse. Note that if you store your credentials in `localStorage` or anything other than a cookie you might want to pair this option with `--settings.disableStorageReset` to force Lighthouse to keep the cache state.

For more information on how to use puppeteer, read up on [their API docs](https://github.com/puppeteer/puppeteer/blob/v2.0.0/docs/api.md#class-browser).

#### `puppeteerLaunchOptions`

An object of options to pass to puppeteer's [`launch` method](https://github.com/puppeteer/puppeteer/blob/v2.0.0/docs/api.md#puppeteerlaunchoptions). Only used when `puppeterScript` is set.

#### `startServerCommand`

The shell command to use to start the project's webserver. LHCI will use this command to start the server before loading the `url`s and automatically shut it down once collection is complete.

Use this option when your project requires a special webserver. **DO NOT** use this option when your project is just a collection of static assets. Use `staticDistDir` instead to use the built-in static server.

#### `startServerReadyPattern`

The regex pattern to look for in the server command's output before considering the server ready for requests. Only used when `startServerCommand` is set.

For example, when using the default `listen|ready`, Lighthouse would start collecting results once the the `startServerCommand` process printed `Listening on port 1337` to stdout.

#### `startServerReadyTimeout`

The maximum amount of time in milliseconds to wait for `startServerCommand` to print the `startServerReadyPattern` before continuing anyway. Only used when `startServerCommand` is set.

#### `settings`

The [Lighthouse settings object](https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md#settings-objectundefined) to pass along to Lighthouse. This can be used to change configuration of it Lighthouse itself.

**Example:**

```json
{
  "ci": {
    "collect": {
      "settings": {
        // Don't run certain audits
        "skipAudits": ["redirects-http"],
        // Don't clear localStorage/IndexedDB/etc before loading the page.
        "disableStorageReset": true,
        // Wait up to 90s for the page to load
        "maxWaitForLoad": 90000,
        // Use applied throttling instead of simulated throttling
        "throttlingMethod": "devtools"
      }
    }
  }
}
```

#### `numberOfRuns`

The number of times to collect Lighthouse results on each `url`. This option helps mitigate fluctations due to natural page [variability](https://github.com/GoogleChrome/lighthouse/blob/v6.0.0-beta.0/docs/variability.md).

#### Examples

```bash
# Basic usage
lhci collect --numberOfRuns=5 --url=https://example.com
# Have LHCI start a server before running
lhci collect --start-server-command="yarn serve" --url=http://localhost:8080/
# Have LHCI use the built-in server on a static directory
lhci collect --staticDistDir=./dist
# Have LHCI use the built-in server and audit a specific URL
lhci collect --staticDistDir=./public --url=http://localhost/products/pricing/
# Run on multiple URLs
lhci collect --url=https://example-1.com --url=https://example-2.com
# Have LHCI start a server and login with puppeteer before running
lhci collect --start-server-command="yarn serve" --url=http://localhost:8080/ --puppeteer-script=./path/to/login-with-puppeteer.js
```

---

### `upload`

Saves the runs in the `.lighthouseci/` folder to desired target and sets a GitHub status check when the GitHub token is available.

```bash
Options:
  --target                       The type of target to upload the data to. If set to anything other
                                 than "lhci", some of the options will not apply.
                            [string] [choices: "lhci", "temporary-public-storage"] [default: "lhci"]
  --token                        [lhci only] The Lighthouse CI build token for the project.[string]
  --ignoreDuplicateBuildFailure  [lhci only] Whether to ignore failures (still exit with code 0)
                                 caused by uploads of a duplicate build.                   [boolean]
  --githubToken                  The GitHub token to use to apply a status check.           [string]
  --githubApiHost                The GitHub host to use for the status check API request. Modify
                                 this when using on a GitHub Enterprise server.
                                                        [string] [default: "https://api.github.com"]
  --githubAppToken               The LHCI GitHub App token to use to apply a status check.  [string]
  --githubStatusContextSuffix    The suffix of the GitHub status check context label.       [string]
  --extraHeaders                 [lhci only] Extra headers to use when making API requests to the
                                 LHCI server.
  --basicAuth.username           [lhci only] The username to use on a server protected with HTTP
                                 Basic Authentication.                                      [string]
  --basicAuth.password           [lhci only] The password to use on a server protected with HTTP
                                 Basic Authentication.                                      [string]
  --serverBaseUrl                [lhci only] The base URL of the LHCI server where results will be
                                 saved.                          [default: "http://localhost:9001/"]
  --uploadUrlMap                 [temporary-public-storage only] Whether to post links to historical
                                 base results to storage or not. Defaults to true only on master
                                 branch.                                  [boolean] [default: false]
  --urlReplacementPatterns       [lhci only] sed-like replacement patterns to mask non-deterministic
                                 URL substrings.                                   [array] [default:
  ["s#:[0-9]{3,5}/#:PORT/#","s/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/UUID/ig"
                                                                                                  ]]
```

#### `target`

The target location to which Lighthouse CI should upload the reports.

**When to use `target=temporary-public-storage`:**

- You want to setup Lighthouse CI as quickly as possible without any costs.
- You're OK with your reports being available to anyone on the internet with the link.
- You're OK with your reports being automatically deleted after 7 days.
- You're OK with your reports being stored on GCP Cloud Storage.

**When to use `target=lhci`:**

- You want to store Lighthouse reports for longer than 7 days.
- You want to control access to your Lighthouse reports.
- You've setup a [Lighthouse CI server](./server.md).

#### `token`

_target=lhci only_

The build token for your Lighthouse CI project. Required when using `target=lhci`. This token should be given to you by `lhci wizard --wizard=new-project`. If you've forgotten your token, connect directly to your server and run `lhci wizard --wizard=reset-build-token`.

#### `ignoreDuplicateBuildFailure`

_target=lhci only_

Boolean that controls whether upload failures due to duplicate build hashes should be ignored. The build token only allows the _creation_ of data on the server and not the _editing_ or _destruction_ of data on the LHCI server. When the CLI attempts to upload a Lighthouse report for a hash that already exists, the server will reject it.

Use this option when you don't run Lighthouse CI as the last step of your CI process or reruns are common.

#### `githubToken`

The GitHub token to use when setting a status check on a GitHub PR. Use this when the project is hosted on GitHub and not using the [official GitHub App](https://github.com/apps/lighthouse-ci).

#### `githubApiHost`

The GitHub API host to use when attempting to set a status check. Use this when the project is hosted on a private GitHub enterprise server and not using the public GitHub API.

#### `githubAppToken`

The GitHub App token returned when installing the [GitHub App](https://github.com/apps/lighthouse-ci). Use this to set status checks on GitHub PRs when using the official GitHub App.

#### `githubStatusContextSuffix`

The suffix to use when setting the status check on a GitHub PR.

For example, by default `lhci` is used as the root of the status check label, but this can be configured to `lhci-app` by setting `githubStatusContextSuffix` to `-app`.

#### `extraHeaders`

_target=lhci only_

A map of additional headers to add the requests made to the LHCI server. Useful for adding bespoke auth tokens.

#### `basicAuth`

_target=lhci only_

An object containing a username and password pair for authenicating with a Basic auth protected LHCI server. Use this setting when you've protected your LHCI server with Basic auth.

**Example:**

```json
{
  "ci": {
    "upload": {
      "basicAuth": {
        "username": "myAdminUser",
        "password": "LighthouseRocks!"
      }
    }
  }
}
```

#### `serverBaseUrl`

_target=lhci only_

The base URL of the LHCI server to upload to. Required when using `target=lhci`.

#### `uploadUrlMap`

_target=temporary-public-storage only_

Boolean that controls whether to update the latest build in temporary public storage associated with this repo. If you use `master` as your default branch, **DO NOT** use this option. If you don't use `master` as your default branch, set this option _when you upload results from your actual default branch_.

#### `urlReplacementPatterns`

_target=lhci only_

A list of replacement patterns that will mask differences in tested URLs that you wish to hide for display or treat as the same. The `urlReplacementPatterns` are used to identify the same URLs for diff comparisons and as preprocessing for GitHub status check labels.

For example, by default Lighthouse CI will automatically replace the port of tested URLs. A localhost static server port may change on each additional invocation, but with `urlReplacementPatterns` the port number is replaced with `PORT` so all builds

**Format:** `s{DELIMITER}{SEARCH_REGEX}{DELIMITER}{REPLACEMENT}{DELIMITER}{SEARCH_REGEX_FLAGS}`

**Notes:**

- There is no escape support for the delimiter, so you must choose a delimiter character that does not appear in your search regex or your replacement.
- Beware of double-escaping requirements. If you're passing a string in JS or an argument through a shell, you may need to use `\\` in order for a `\` to be seen by Lighthouse CI.
- If you set `urlReplacementPatterns` yourself, you will lose the defaults provided by Lighthouse CI. If you need the functionality provided by the defaults, be sure to copy them into your configuration as well.

**Examples:**

- `s/Foo/Bar/g` - Replace _all_ occurrences of `Foo` with `Bar`, case-sensitive.
- `s/v\d+/VERSION/i` - Replace the _first_ sequence of a v followed by digits with `VERSION`, case-insensitive.
- `s#(//.*?)/.*$#$1/replaceThePath#` - Replace the entire URL following the origin with `/replaceThePath` using `#` as the delimiter character and a group reference.

#### Build Context

When uploading to the Lighthouse CI server, the CLI will attempt to automatically infer the build context such as git hash, author, message, ancestor, etc. In most cases, there's nothing you need to change about this, but if you're running without a git repo, in a Jenkins environment, a CI provider we haven't documented yet, or are just running into errors, you can control the build context yourself.

The following environment variables override the inferred build context settings.

| Name                                     | Example Format                                  |
| ---------------------------------------- | ----------------------------------------------- |
| `LHCI_BUILD_CONTEXT__GIT_REMOTE`         | `git@github.com:GoogleChrome/lighthouse-ci.git` |
| `LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG`   | `GoogleChrome/lighthouse-ci`                    |
| `LHCI_BUILD_CONTEXT__CURRENT_HASH`       | `e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63`      |
| `LHCI_BUILD_CONTEXT__ANCESTOR_HASH`      | `78bafdcaf40e204c0d0b81b90bb76b9aa5834e11`      |
| `LHCI_BUILD_CONTEXT__COMMIT_TIME`        | `2019-11-29T16:43:39-05:00`                     |
| `LHCI_BUILD_CONTEXT__CURRENT_BRANCH`     | `dev_branch_1234`                               |
| `LHCI_BUILD_CONTEXT__COMMIT_MESSAGE`     | `Daily run of Lighthouse`                       |
| `LHCI_BUILD_CONTEXT__AUTHOR`             | `Patrick Hulce <patrick.hulce@example.com>`     |
| `LHCI_BUILD_CONTEXT__AVATAR_URL`         | https://example.com/patrickhulce.jpg            |
| `LHCI_BUILD_CONTEXT__EXTERNAL_BUILD_URL` | https://my-jenkins.example.com/jobs/123         |

#### Examples

```bash
lhci upload --config=./lighthouserc.json
lhci upload --target=temporary-public-storage
lhci upload --serverBaseUrl=http://lhci.my-custom-domain.com/
lhci upload --extraHeaders.Authorization='Bearer X92sEo3n1J1F0k1E9'
lhci upload --basicAuth.username="customuser" --basicAuth.password="LighthouseRocks"
lhci upload --githubToken="$MY_ENTERPRISE_GITHUB_TOKEN" --githubApiHost="https://custom-github-server.example.com/api/v3"
```

---

### `assert`

Asserts the conditions in the Lighthouse CI config and exits with the appropriate status code if there were any failures.

```bash
Options:
  --preset                   The assertions preset to extend
                          [choices: "lighthouse:all", "lighthouse:recommended", "lighthouse:no-pwa"]
  --assertions               The assertions to use.
  --budgetsFile              The path (relative to cwd) to a budgets.json file.
  --includePassedAssertions  Whether to include the results of passed assertions in the output.
                                                                                           [boolean]
```

#### `assertions`

The result of any audit in Lighthouse can be asserted. Assertions are keyed by the Lighthouse audit ID and follow an eslint-style format of `level | [level, options]`. For a reference of the audit IDs in each category, you can take a look at the [default Lighthouse config](https://github.com/GoogleChrome/lighthouse/blob/v5.5.0/lighthouse-core/config/default-config.js#L375-L407). When no options are set, the default options of `{"aggregationMethod": "optimistic", "minScore": 1}` are used.

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": "off",
        "works-offline": ["warn", {"minScore": 1}],
        "uses-responsive-images": ["error", {"maxLength": 0}]
      }
    }
  }
}
```

##### Categories

The score of any category in Lighthouse can also be asserted. Assertions are keyed by `categories:<categoryId>` and follow the same eslint-style format as audit assertions. Note that this just affects the _category score_ and will not affect any assertions on individual audits within the category.

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 1}]
      }
    }
  }
}
```

##### Levels

There are three Lighthouse CI assertion levels.

- `off` - The audit result will not be checked. If an audit is not found in the `assertions` object, it is assumed to be `off`.
- `warn` - The audit result will be checked, and the result will be printed to stderr, but failure will not result in a non-zero exit code.
- `error` - The audit result will be checked, the result will be printed to stderr, and failure will result in a non-zero exit code.

##### Properties

The `score`, `details.items.length`, and `numericValue` properties of audit results can all be checked against configurable thresholds. Use `minScore`, `maxLength`, and `maxNumericValue` properties, respectively, in the options object to control the assertion.

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "audit-id-1": ["warn", {"maxNumericValue": 4000}],
        "audit-id-2": ["error", {"minScore": 0.8}],
        "audit-id-3": ["warn", {"maxLength": 0}]
      }
    }
  }
}
```

##### Aggregation Methods

When checking the results of multiple Lighthouse runs, there are multiple strategies for aggregating the results before asserting the threshold.

- `median` - Use the median value from all runs.
- `optimistic` - Use the value that is most likely to pass from all runs.
- `pessimistic` - Use the value that is least likely to pass from all runs.
- `median-run` Use the value of the run that was determined to be "most representative" of all runs based on key performance metrics. Note that this differs from `median` because the audit you're asserting might not be the performance metric that was used to select the `median-run`.

##### User Timings

Your custom user timings using [`performance.mark`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark) and [`performance.measure`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure) can be asserted against as well.

The general format for asserting against a user timing value is `"user-timings:<kebab-cased-name>": ["<level>", {maxNumericValue: <value in milliseconds>}]`. For example, if you wanted to assert that a mark with name `My Custom Mark` started within the first 2s of page load and that a measure `my:custom-@-Measure` lasted fewer than 50 ms you would use the following assertions config.

Note that only the first matching entry with the name will be used from each run and the rest will be ignored.

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "user-timings:my-custom-mark": ["warn", {"maxNumericValue": 2000}],
        "user-timings:my-custom-measure": ["error", {"maxNumericValue": 50}]
      }
    }
  }
}
```

#### `assertMatrix`

`assertMatrix` can be used to assert against multiple URLs at the same time. When checking the results of runs against multiple URLs, different assertions can be made for different URL patterns.

The below example warns when FCP is above 2 seconds on _all_ pages **and** warns when TTI is above 5 seconds on all _secure_ pages _whose path starts with `/app`_. Assertion matrix configurations can be used to differentiate production from development, landing pages from single-page apps, and more.

```json
{
  "ci": {
    "assert": {
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
  }
}
```

#### `preset`

There are three presets available to provide a good starting point. Presets can be extended with manual assertions.

- `lighthouse:all` - Asserts that every audit received a perfect score. This is extremely difficult to do. Only use as a base on very high quality, greenfield projects and lower the tresholds as needed.
- `lighthouse:recommended` - Asserts that every audit outside performance received a perfect score, that no resources were flagged for performance opportunities, and warns when metric values drop below a score of `90`. This is a more realistic base that disables hard failures for flaky audits.
- `lighthouse:no-pwa` - `lighthouse:recommended` but without any of the PWA audits enabled.

The below example uses the `lighthouse:no-pwa` preset but disables a few audits we're not quite ready to pass yet and increases the limit on an audit with a `numericValue`.

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "dom-size": ["error", {"maxNumericValue": 3000}],
        "offscreen-images": "off",
        "color-contrast": "off",
        "tap-targets": "off"
      }
    }
  }
}
```

#### `budgetsFile`

Instead of configuring using Lighthouse CI assertions against Lighthouse audits, a [budget.json](https://github.com/GoogleChrome/budget.json) file can be used instead. This option cannot be used in conjunction with any other assert option.

```json
{
  "ci": {
    "assert": {
      "budgetsFile": "path/from/cwd/to/budget.json"
    }
  }
}
```

If you'd like to consolidate multiple assertion configuration files and avoid multiple calls to `lhci assert`, you can also configure your budgets alongside your other Lighthouse CI assertions instead. Budget assertions follow the form `resource-summary:<resourceType>:(size|count)`.

**Note:** when using the Lighthouse CI style assertions the `maxNumericValue` unit for file size is in _bytes_ while the budget.json unit for file size is in _kilobytes_.

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["warn", {"maxNumericValue": 4000}],
        "viewport": "error",
        "resource-summary:document:size": ["error", {"maxNumericValue": 14000}],
        "resource-summary:font:count": ["warn", {"maxNumericValue": 1}],
        "resource-summary:third-party:count": ["warn", {"maxNumericValue": 5}]
      }
    }
  }
}
```

#### `includePassedAssertions`

Boolean that controls whether passed assertions should be included in the output. Only assertions that didn't pass are shown normally.

#### Examples

```bash
lhci assert --config=./lighthouserc.json
lhci assert --budgetsFile=./budgets.json
lhci assert --preset=lighthouse:recommended --assertions.speed-index=off
lhci assert --preset=lighthouse:recommended --includePassedAssertions
```

---

### `open`

Open a local lighthouse report that has been created using `collect`. There is no configuration for this command.

```bash
lhci open
```

---

### `wizard`

Runs an interactive step-by-step wizard to accomplish various Lighthouse CI tasks. Resetting tokens will require a server configuration file and running on a device that has direct write access to the server's database.

```bash
lhci wizard
? Which wizard do you want to run? (Use arrow keys)
❯ new-project
  reset-build-token
  reset-admin-token
```

---

### `server`

Starts the LHCI server. This command is unique in that it is likely run on infrastructure rather than in your build process. Learn more about the [LHCI server](./server.md) and [how to setup your personal LHCI server](./recipes/heroku-server/README.md) accessible over the internet.

```bash

Run Lighthouse CI server

Options:
  --logLevel                            [string] [choices: "silent", "verbose"] [default: "verbose"]
  --port, -p                                                                [number] [default: 9001]
  --storage.storageMethod                      [string] [choices: "sql", "spanner"] [default: "sql"]
  --storage.sqlDialect         [string] [choices: "sqlite", "postgres", "mysql"] [default: "sqlite"]
  --storage.sqlDatabasePath              The path to a SQLite database on disk.
  --storage.sqlConnectionUrl             The connection url to a postgres or mysql database.
  --storage.sqlConnectionSsl             Whether the SQL connection should force use of SSL
                                                                          [boolean] [default: false]
  --storage.sqlDangerouslyResetDatabase  Whether to force the database to the required schema.
                                         WARNING: THIS WILL DELETE ALL DATA
                                                                          [boolean] [default: false]
  --basicAuth.username                   The username to protect the server with HTTP Basic
                                         Authentication.                                    [string]
  --basicAuth.password                   The password to protect the server with HTTP Basic
                                         Authentication.                                    [string]
```

**Examples**

```bash
lhci server --storage.sqlDatabasePath=./lhci.db
lhci server --storage.sqlDialect=postgres --storage.sqlConnectionUrl="postgres://user@localhost/lighthouse_ci_db"
lhci server --storage.sqlDatabasePath=./lhci.db --basicAuth.username="customuser" --basicAuth.password="LighthouseRocks"
```

## Recommended Configurations

### Easy Mode

**Recommended for those new to Lighthouse.**

If you're just beginning to measure your project with Lighthouse, start slowly and manually monitor your scores first by only configuring `upload`. Once you're comfortable, consider moving up to [Intermediate](#intermediate).

Combine this with [GitHub App](https://github.com/apps/lighthouse-ci) to get convenient links to your reports.

```json
{
  "ci": {
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Next Level

**Recommended for those familiar with Lighthouse, but new to performance measurement in CI.**

If you're used to running Lighthouse on your project but still have some work to do, assert the recommended preset but disable the audits you're currently failing. Consider setting up the [Lighthouse CI server](./server.md) to track your scores over time.

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "offscreen-images": "off",
        "uses-webp-images": "off",
        "color-contrast": "off"
        // ...
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### The Complete Experience

**Recommended for seasoned Lighthouse users who are used to measuring performance in CI.**

If you're a Lighthouse pro, assert the recommended preset, increase the number of runs, and set budgets for your performance metrics. Set up the [Lighthouse CI server](./server.md) to track your scores over time and receive build diffs when your metrics regress.

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 5
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": [
          "error",
          {"maxNumericValue": 2000, "aggregationMethod": "optimistic"}
        ],
        "interactive": ["error", {"maxNumericValue": 5000, "aggregationMethod": "optimistic"}]
        // ...
      }
    },
    "upload": {
      "target": "lhci",
      "serverBaseUrl": "https://lhci.example.com"
    }
  }
}
```

## Common Examples

### Custom build directory

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./_site"
    }
  }
}
```

### Custom Lighthouse Config

```json
{
  "ci": {
    "collect": {
      "settings": {
        "configPath": "./path/to/lighthouse/config.js",
        "plugins": ["lighthouse-plugin-field-performance"]
      }
    }
  }
}
```

### Custom Chrome Flags

```json
{
  "ci": {
    "collect": {
      "settings": {
        "chromeFlags": "--disable-gpu --no-sandbox"
      }
    }
  }
}
```

### Page Behind Authentication

```json
{
  "ci": {
    "collect": {
      "settings": {
        "extraHeaders": "{\"Cookie\": \"token=1234\"}"
      }
    }
  }
}
```

```js
module.exports = {
  ci: {
    collect: {
      settings: {
        extraHeaders: JSON.stringify({Cookie: 'token=1234'}),
      },
    },
  },
};
```

### Non-NodeJS Development Server

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "rails server -e production",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/pricing",
        "http://localhost:3000/support"
      ]
    }
  }
}
```

### Budgets.json

```json
{
  "ci": {
    "collect": {
      "settings": {
        // This setting makes the budgets section appear in the Lighthouse report itself
        "budgetsPath": "./path/to/budgets.json"
      }
    },
    "assert": {
      "assertions": {
        // This setting asserts that the budgets audit passed in Lighthouse CI
        "performance-budget": "error"
      }
    }
  }
}
```

### Basic Auth (Client)

```json
{
  "ci": {
    "upload": {
      "basicAuth": {
        "username": "myusername",
        "password": "LighthouseRocks"
      }
    }
  }
}
```

### Basic Auth (Server)

```json
{
  "ci": {
    "server": {
      "basicAuth": {
        "username": "myusername",
        "password": "LighthouseRocks"
      },
      "storage": {
        // ...
      }
    }
  }
}
```

### Custom SSL Certificate for Database Connection

```js
const fs = require('fs');

module.exports = {
  ci: {
    server: {
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'postgres',
        sqlConnectionSsl: true,
        sqlConnectionUrl: process.env.DATABASE_URL,
        sqlDialectOptions: {
          ssl: {
            ca: fs.readFileSync('./certs/ca.crt', 'utf8'),
            key: fs.readFileSync('./certs/client.foo.key', 'utf8'),
            cert: fs.readFileSync('./certs/client.foo.crt', 'utf8'),
          },
        },
      },
    },
  },
};
```

### Custom Sequelize Configuration

See [the sequelize docs](https://sequelize.org/v4/) for more information on available settings.

```js
module.exports = {
  ci: {
    server: {
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'postgres',
        sqlConnectionSsl: true,
        sqlConnectionUrl: process.env.DATABASE_URL,
        sequelizeOptions: {
          pool: {
            acquire: 30000,
          },
        },
      },
    },
  },
};
```

### Custom Headers for Wizard

If you're running the `lhci server` behind a reverse proxy or any other component that requires some extra headers you can configure them in the wizard section `extraHeaders`.

```json
{
  "ci": {
    "wizard": {
      "extraHeaders": "{\"Authorization\": \"Basic content\"}"
    }
  }
}
```

> **_NOTE:_** The `wizard` options will be overwritten by the `upload` options, to be sure that the wizard options will be used, create a separate config file.

### Default LHCI Server for Wizard

If you're running the `lhci wizard` multiple times, you can configure a default `serverBaseUrl` to avoid typing it in at each `lhci wizard` run.

```json
{
  "ci": {
    "wizard": {
      "serverBaseUrl": "https://localhost:3000/"
    }
  }
}
```

> **_NOTE:_** The `wizard` options will be overwritten by the `upload` options, to be sure that the wizard options will be used, create a separate config file.

### YAML Advanced config

```yml
ci:
  collect:
    numberOfRuns: 5
    startServerCommand: rails server -e production
    url:
      - http://localhost:3000/
      - http://localhost:3000/pricing
      - http://localhost:3000/support
  assert:
    preset: lighthouse:recommended
    assertions:
      offscreen-images: 'off'
      uses-webp-images: 'off'
      color-contrast: 'off'
      first-contentful-paint:
        - error
        - maxNumericValue: 2000
          aggregationMethod: optimistic
      interactive:
        - error
        - maxNumericValue: 5000
          aggregationMethod: optimistic
  upload:
    target: lhci
    serverBaseUrl: https://lhci.example.com
```
