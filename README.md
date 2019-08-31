# Lighthouse CI

## Overview

Lighthouse CI is a set of commands that make running, asserting, saving, and retrieving [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

## Commands

### `server`

```bash
lighthouse-ci server
```

Starts a local server that exposes an API to save projects/builds/runs to a database. Currently, data is saved with SQLite to a local database path, but conceptually it's easy to write to bigtable or some other store and free to write to any other SQL store.

### `collect`

```bash
lighthouse-ci collect --numberOfRuns=5 --url=https://example.com
```

Runs Lighthouse `N` times and stores the LHRs in a local `.lighthouseci/` folder, similar to the way test coverage tools operate.

### `upload`

```bash
lighthouse-ci upload
```

Saves all the runs in the `.lighthouseci/` folder to the server as a single build, similar to a Coveralls/CodeCov upload step. In the future, I imagine this can also return the results of the server's assertions against the parent hash.

### `assert`

```bash
lighthouse-ci assert --preset=lighthouse:recommended --assertions.speed-index=off
```

Asserts the conditions in the Lighthouse CI config and preset. Currently, assert supports the following features:

1. **Assertions** - there are 2 assertions for each audit, `minScore` and `maxLength`. `minScore` asserts that the score of the audit is at least the provided value. `maxLength` asserts that the number of items flagged by the audit is no more than the provided value.
2. **Merge Strategies** - there are 3 merging strategies `median`, `optimistic`, `pessimistic`. Median fails if the median run fails, optimistic fails only if all runs fail, and pessimistic fails if any of the runs fail.
3. Error and warn levels are both available.
4. **Presets** - there are two built-in presets `lighthouse:all`, which has every audit set to error if it's not a 100, and `lighthouse:recommended` which has every audit set to warn if it's not 100 and the _metrics_ error if not >=90.

## Configuration

In addition to the flags available to each command, `lighthouse-ci` supports a configuration file that can set the same options.

**Usage**

```bash
# Specify an rc file via environment variable
export LHCI_RC_FILE=path/to/rc/file
lighthouse-ci <command>

# Specify an rc file via command-line flag
lighthouse-ci --rc-file=path/to/different/rc/file <command>
```

**Example RC File**

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"minScore": 0.8}],
        "speed-index": ["error", {"minScore": 0.8}],
        "interactive": ["error", {"minScore": 0.8}]
      }
    },
    "collect": {
      "numberOfRuns": 2
    },
    "upload": {
      "serverBaseUrl": "http://localhost:9009"
    },
    "server": {
      "port": 9009,
      "storage": {
        "sqlDatabasePath": "example-data.sql"
      }
    }
  }
}
```
