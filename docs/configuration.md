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

If your productionized static assets live in a different folder or your project does not use a build step at all, see the [`lhci collect` documentation](#collect) for how to configure your project.

#### Detecting `collect.startServerCommand`

Autorun will attempt to automatically detect the `collect.startServerCommand` based on our `package.json`. To allow autorun to automatically start your webserver, add an npm script named `serve:lhci`.

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

**Examples**

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

**Examples**

```bash
lhci upload --config=./lighthouserc.json
lhci upload --target=temporary-public-storage
lhci upload --serverBaseUrl=http://lhci.my-custom-domain.com/
lhci upload --extraHeaders.Authorization='Bearer X92sEo3n1J1F0k1E9'
lhci upload --basicAuth.username="customuser" --basicAuth.password="LighthouseRocks"
lhci upload --githubToken="$MY_ENTERPRISE_GITHUB_TOKEN" --githubApiHost="https://custom-github-server.example.com/api/v3"
```

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

---

### `assert`

Asserts the conditions in the Lighthouse CI config and exits with the appropriate status code if there were any failures. See the [assertion docs](./assertions.md) for more.

```bash
Options:
  --preset                   The assertions preset to extend
                          [choices: "lighthouse:all", "lighthouse:recommended", "lighthouse:no-pwa"]
  --assertions               The assertions to use.
  --budgetsFile              The path (relative to cwd) to a budgets.json file.
  --includePassedAssertions  Whether to include the results of passed assertions in the output.
                                                                                           [boolean]
```

**Examples**

```bash
lhci assert --config=./lighthouserc.json
lhci assert --budgetsFile=./budgets.json
lhci assert --preset=lighthouse:recommended --assertions.speed-index=off
lhci assert --preset=lighthouse:recommended --includePassedAssertions
```

---

### `open`

Open a local lighthouse report that has been created using `collect`.

```bash
lhci open
```

---

### `wizard`

Runs an interactive step-by-step wizard to either A) create a new project on the LHCI server or B) reset a project's admin token.

```bash
lhci wizard
```

---

### `server`

Starts the LHCI server. This command is unique in that it is likely run on infrastructure rather than in your build process. Learn more about the [LHCI server](./getting-started.md#the-lighthouse-ci-server) and [how to setup your personal LHCI server](./recipes/heroku-server/README.md) accessible over the internet.

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

## Configuration

Configuring settings for Lighthouse CI is most easily done through a `lighthouserc.json` file. The file supports configuration for the four major commands, `collect`, `upload`, `assert`, and `server`. Learn more about [configuration](./configuration.md).

**Usage**

```bash
# Your config file is at `./lighthouserc.json` and will be picked up automatically
lhci <command>

# Specify a config file via command-line flag
lhci <command> --config=path/to/different/rc/file
```

**Example Project Config File**

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 5
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "offscreen-images": "off",
        "uses-webp-images": "off"
      }
    },
    "upload": {
      "serverBaseUrl": "http://my-custom-lhci-server.example.com/"
    }
  }
}
```

**Example Server RC File**

```json
{
  "ci": {
    "server": {
      "port": 9009,
      "storage": {
        "sqlDatabasePath": "/home/lhci/lhci.db"
      }
    }
  }
}
```

## Recommendations

### Beginner

If you're just beginning to measure your project with Lighthouse, start slow and manually monitor your scores first by only configuring `upload`. Once you're comfortable, consider moving up to [Intermediate](#intermediate).

```json
{
  "ci": {
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Intermediate

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

### Advanced

If you're a Lighthouse pro, assert the recommended preset, increase the number of runs, and set budgets for your performance metrics. Consider setting up the [Lighthouse CI server](./server.md) to track your scores over time.

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
    "assert": {
      "budgetsFile": "./path/to/budgets.json"
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
