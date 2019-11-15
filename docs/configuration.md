# Configuration

## Overview

Lighthouse CI configuration can be managed through a config file, environment variables, and CLI flag overrides.

### Configuration File

Lighthouse CI will automatically look for a configuration file in the current working directory in the following priority order:

1. `.lighthouserc.json`
1. `lighthouserc.json`

Note that upward traversal is not supported. If you'd like to keep your lighthouse configuration in a different location, you can explicitly pass in a configuration file path to any `lhci` command using `--config=./path/to/file`.

### Environment Variables

Any configuration option can also be set using environment variables prefixed with `LHCI_`.

```bash
LHCI_TOKEN=12345 lhci upload
# is equivalent to...
lhci upload --token=12345
```

### CLI Flags

Of course CLI flags can set options as well in addition to nested properties!

```bash
lhci assert --preset=lighthouse:recommended --assertions.uses-webp-images=off
```

## Structure

The structure of a `lighthouserc.json` is segmented by command. Any options you see for a particular command in the [CLI documentation](./cli.md) can be set by the property of the same name in the config file.

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

If you're used to running Lighthouse on your project but still have some work to do, assert the recommended preset but disable the audits you're currently failing. Consider setting up the [Lighthouse CI server](./recipes/docker-server/README.md) to track your scores over time.

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

If you're a Lighthouse pro, assert the recommended preset, increase the number of runs, and set budgets for your performance metrics. Consider setting up the [Lighthouse CI server](./recipes/docker-server/README.md) to track your scores over time.

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

### Custom Lighthouse Config

```json
{
  "ci": {
    "collect": {
      "settings": {
        "configPath": "./path/to/lighthouse/config.js"
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

### Non-NodeJS Server

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
