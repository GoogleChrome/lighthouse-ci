# CLI

## Overview

The CLI is the primary API you'll use when setting up Lighthouse CI. Install the CLI globally to try it out locally.

```bash
npm install -g @lhci/cli
```

## Commands

All commands support configuration via a JSON file passed in via `--config=./path/to/`. Any argument on the CLI can also be passed in via environment variable. For example, `--config=foo` can be replaced with `LH_RC_FILE=foo`. Learn more about [configuration](./configuration.md).

### `healthcheck`

Runs diagnostics to ensure a valid configuration, useful when setting up Lighthouse CI for the first time to test your configuration.

```bash
lhci healthcheck --help

Run diagnostics to ensure a valid configuration

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --config   Path to JSON config file
  --fatal    Exit with a non-zero status code when a component fails the status
             check.                                                    [boolean]
  --checks   The list of opt-in checks to include in the fatality check. [array]
```

**Examples**

```bash
lhci healthcheck --fatal --checks=githubToken
```

---

### `autorun`

Automatically run `collect` with sensible defaults and `assert` or `upload` as specified. Options for individual commands can be set by prefixing the option with the command name.

**Examples**

```bash
lhci autorun --config=./lighthouserc.json
lhci autorun --collect.numberOfRuns=5
lhci autorun --upload.target=temporary-public-storage
```

#### Starting a webserver

To allow autorun to automatically start your own webserver, add an npm script named `serve:lhci`. autorun will execute this script before collection.

example `package.json` excerpt:

```json
  "scripts": {
    "serve:lhci": "NODE_ENV=production npm run server"
  }
```

You can also supply the custom server initalization command from `collect` as a flag directly to `autorun`:

```bash
lhci autorun --collect.startServerCommand="rails server -e production"
```

---

### `open`

Open a local lighthouse report that has been created using `collect`.

**Examples**

```bash
lhci open
```

---

### `wizard`

Runs an interactive step-by-step wizard to create a new project on the LHCI server.

**Examples**

```bash
lhci wizard
```

---

### `collect`

Runs Lighthouse n times and stores the LHRs in a local `.lighthouseci/` folder.

```bash
lhci collect --help

Run Lighthouse and save the results to a local folder

Options:
  --help                Show help                                      [boolean]
  --version             Show version number                            [boolean]
  --config              Path to JSON config file
  --method                          [string] [choices: "node"] [default: "node"]
  --headful             Run with a headful Chrome                      [boolean]
  --additive            Skips clearing of previous collect data        [boolean]
  --url                 A URL to run Lighthouse on.  You can evaluate multiple
                        URLs by adding this flag multiple times.
  --staticDistDir       The build directory where your HTML files to run
                        Lighthouse on are located.
  --startServerCommand  The command to run to start the server.
  --settings            The Lighthouse settings and flags to use when collecting
  --numberOfRuns, -n    The number of times to run Lighthouse.
                                                           [number] [default: 3]
```

**Examples**

```
lhci collect --numberOfRuns=5 --url=https://example.com
lhci collect --start-server-command="yarn serve" --url=http://localhost:8080/
lhci collect --staticDistDir=./dist
lhci collect --url=https://example-1.com --url=https://example-2.com
```

---

### `upload`

Saves the runs in the `.lighthouseci/` folder to desired target and sets a GitHub status check when token is available.

```bash
lhci upload --help

Save the results to the server

Options:
  --help                    Show help                                  [boolean]
  --version                 Show version number                        [boolean]
  --config                  Path to JSON config file
  --target                  The type of target to upload the data to. If set to
                            anything other than "lhci", some of the options will
                            not apply.
        [string] [choices: "lhci", "temporary-public-storage"] [default: "lhci"]
  --token                   The Lighthouse CI server token for the project, only
                            applies to `lhci` target.                   [string]
  --githubToken             The GitHub token to use to apply a status check.
                                                                        [string]
  --githubAppToken          The LHCI GitHub App token to use to apply a status
                            check.                                      [string]
  --serverBaseUrl           The base URL of the server where results will be
                            saved.           [default: "http://localhost:9001/"]
  --urlReplacementPatterns  sed-like replacement patterns to mask
                            non-deterministic URL substrings.  [array] [default:
  ["s#:[0-9]{3,5}/#:PORT/#","s/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[
                                                          0-9a-f]{12}/UUID/ig"]]
```

**Examples**

```bash
lhci upload --config=./lighthouserc.json
lhci upload --target=temporary-public-storage
lhci upload --serverBaseUrl=http://lhci.my-custom-domain.com/
```

---

### `assert`

Asserts the conditions in the Lighthouse CI config and exits with the appropriate status code if there were any failures. See the [assertion docs](./assertions.md) for more.

```bash
lhci assert

Assert that the latest results meet expectations

Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --config       Path to JSON config file
  --preset       The assertions preset to extend
                           [choices: "lighthouse:all", "lighthouse:recommended"]
  --assertions   The assertions to use.
  --budgetsFile  The path (relative to cwd) to a budgets.json file.
```

**Examples**

```bash
lhci assert --config=./lighthouserc.json
lhci assert --preset=lighthouse:recommended --assertions.speed-index=off
```

---

### `server`

Starts the LHCI server. This command is unique in that it is likely run on infrastructure rather than in your build process. Learn more about the [LHCI server](./server.md) and how to setup your personal LHCI server accessible over the internet.

```bash

Run Lighthouse CI server

Options:
  --help                                 Show help                     [boolean]
  --version                              Show version number           [boolean]
  --config                               Path to JSON config file
  --logLevel        [string] [choices: "silent", "verbose"] [default: "verbose"]
  --port, -p                                            [number] [default: 9001]
  --storage.sqlDialect
                    [string] [choices: "sqlite", "postgres"] [default: "sqlite"]
  --storage.sqlDatabasePath              The path to a SQLite database on disk.
  --storage.sqlConnectionUrl             The connection url to a postgres or
                                         mysql database.
  --storage.sqlConnectionSsl             Whether the SQL connection should force
                                         use of SSL   [boolean] [default: false]
  --storage.sqlDangerouslyResetDatabase  Whether to force the database to the
                                         required schema. WARNING: THIS WILL
                                         DELETE ALL DATA
                                                      [boolean] [default: false]
```

**Examples**

```bash
lhci server --storage.sqlDatabasePath=./lhci.db
lhci server --storage.sqlDialect=postgres --storage.sqlConnectionUrl="postgres://user@localhost/lighthouse_ci_db"
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
