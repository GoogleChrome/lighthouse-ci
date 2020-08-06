# Complex Setup

This guide is meant for complicated setups where `lhci autorun` isn't enough. Try to setup Lighthouse CI using the [Getting Started guide](./getting-started.md) first before continuing.

## LHCI Process Steps

A Lighthouse CI run will roughly follow these steps.

1. Serve your site locally or deploy to a development server.
2. Collect Lighthouse results with Lighthouse CI.
3. (Optional) Assert that the results meet your expectations.
4. (Optional) Upload the results for helpful debugging and historical analysis. (See [Storing Reports](#storing-reports))

The complete script might look something like the below, but read on for the breakdown and explanations.

```bash
#!/bin/bash

# NOTE: This step only required for matrix builds, see "Create a run-lhci script" for more details.
if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then
  echo "Only run Lighthouse CI once per build, node version is not the selected version.";
  exit 0;
fi

npm run deploy

npm install -g @lhci/cli@0.4.x
lhci healthcheck --fatal
lhci collect --url=http://localhost:9000/index.html
lhci assert --preset="lighthouse:recommended"
EXIT_CODE=$?

kill $!
exit $EXIT_CODE
```

### Setup CI Environment

To run Lighthouse CI, you'll need...

- Node v10 LTS or later
- Chrome Stable or later
- (if Ubuntu) Xenial or later

In your Travis, this translates to...

**.travis.yml**

```yaml
dist: xenial
language: node_js
node_js:
  - '10'
addons:
  chrome: stable
```

### Create a run-lhci script

To contain all the steps necessary for Lighthouse CI, we'll create a file located at `scripts/run-lhci.sh` that should run as part of the build process.

**NOTE:** Make sure that this script is only run once per build or it will lead to confusing upload artifacts. For example, if you have a matrix build of several node versions, only run Lighthouse CI on one of them.

**.travis.yml**

```yaml
script:
  - npm run build # build your site
  - npm test # run normal tests
  - ./scripts/run-lhci.sh # run lighthouse ci
```

**scripts/run-lhci.sh**

```bash
#!/bin/bash

# Example if your travis build runs a matrix like...
# matrix:
#   - 12
#   - 10
if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then
  echo "Only run Lighthouse CI once per build, node version is not the selected version.";
  exit 0;
fi

# ...
```

#### Serve Your Site

To run Lighthouse CI, the built site you'd like to test with Lighthouse needs to be available on a server. You can either use the built-in Lighthouse CI static server, a custom local development server, or deploy to a staging location that's accessible to your CI.

For this example, we'll assume your site is already built in a local directory called `./dist`, and we'll use the the `http-server` node package as an example custom server implementation (do not follow this structure just to use `http-server`, it is less fully featured than `lhci collect --static-dist-dir=./dist`, see [Run Lighthouse CI](#run-lighthouse-ci) for more).

```bash
#!/bin/bash

# Start a custom local development server (in a background process)
# Protip: deploy your code to a web-accessible staging server instead for more realistic performance metrics
npx http-server -p 9000 ./dist &

# ... (run lighthouse ci)

# Clean up the development server
kill $!
```

You can also automate the backgrounding and clean up with [`lhci collect`'s `startServerCommand` flag](./cli#collect).

#### Run Lighthouse CI

Now that we have our environment ready, time to run Lighthouse CI. The `collect` command takes either a build directory filled with production files, or a list of URLs to audit. When given a build directory, Lighthouse CI will handle the server for you, but since we're using a custom server implementation here, we'll use the URL mode.

```bash
#!/bin/bash

# ... (build condition check)

# ... (server setup)

# Install Lighthouse CI
# If you're already using node to manage your project, add it to your package.json `devDependencies` instead to skip this step.
npm install -g @lhci/cli@0.4.x

# Run a healthcheck to make sure everything looks good before we run collection.
lhci healthcheck --fatal

# Collect Lighthouse reports for our URL.
lhci collect --url=http://localhost:9000/index.html

# Assert that the reports look good, this command can be configured to ease your Lighthouse transition.
lhci assert --preset="lighthouse:recommended"
EXIT_CODE=$?

# ... (kill server)

exit $EXIT_CODE
```

### Configuration

The setup so far will automatically assert the Lighthouse team's recommended set of audits, but your project might have a bit of work to go before hitting straight 100s! Lucky for you the assertions are completely configurable! Read more about what's possible with [the assertions format](./configuration.md#assert).

**lighthouserc.json**

```jsonc
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "uses-responsive-images": "off",
        ... other overrides you need
      }
    }
  }
}
```

```bash
lhci assert --config=lighthouserc.json
```
