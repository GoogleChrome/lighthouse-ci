### This project is in **early alpha**. It is available for **testing only**.

### **Do not rely on this for production workloads.**

---

# Lighthouse CI

## Overview

Lighthouse CI is a set of commands that make running, asserting, saving, and retrieving [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

## Commands

### `server`

```bash
lhci server
```

Starts a local server that exposes an API to save projects/builds/runs to a database. Currently, data is saved with SQLite to a local database path, but conceptually it's easy to write to bigtable or some other store and free to write to any other SQL store.

### `collect`

```bash
lhci collect --numberOfRuns=5 --url=https://example.com
```

Runs Lighthouse `N` times and stores the LHRs in a local `.lighthouseci/` folder, similar to the way test coverage tools operate.

### `upload`

```bash
lhci upload
```

Saves all the runs in the `.lighthouseci/` folder to the server as a single build, similar to a Coveralls/CodeCov upload step. In the future, I imagine this can also return the results of the server's assertions against the parent hash.

### `assert`

```bash
lhci assert --preset=lighthouse:recommended --assertions.speed-index=off
```

Asserts the conditions in the Lighthouse CI config and exits with the appropriate status code if there were any failures. See the [assertion docs](./docs/assertions.md) for more.

## Configuration

In addition to the flags available to each command, `lighthouse-ci` supports a configuration file that can set the same options.

**Usage**

```bash
# Specify an rc file via environment variable
export LHCI_RC_FILE=path/to/rc/file
lighthouse-ci <command>

# Specify an rc file via command-line flag
lhci --rc-file=path/to/different/rc/file <command>
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
