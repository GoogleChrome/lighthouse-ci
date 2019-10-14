# Getting Started

This guide will walk you through how to setup Lighthouse CI on your repository.

Estimated Time: ~15 minutes

## Prerequisites

Before you can start using this guide, your project should already meet the following requirements:

1. Source code is managed with git (GitHub, GitLab, Bitbucket, etc).
2. Branches/pull requests are gated on the results of a continuous integration build process (Travis CI, CircleCI, Azure Pipelines, AppVeyor, etc).

In the examples that follow, use of GitHub and Travis CI are assumed but the same concepts apply to other providers. Refer to your specific provider's documentation for how to accomplish each setup step.

## Setup

Roughly a Lighthouse CI will follow these steps.

1. Configure CI environment.
2. Deploy your code to a development server.
3. Collect Lighthouse results with Lighthouse CI.
4. Assert that the results meet your expectations.
5. (Optional) Upload the results for helpful debugging and historical analysis. (See [Extra Goodies](#extra-goodies))

### Configure CI Environment

To run Lighthouse CI, you'll need...

- Node v10 LTS or later
- Chrome Stable or later
- (if Ubuntu) Xenial or later

In your Travis, this translates to...

**.travis.yml**

```yaml
sudo: required
dist: xenial
language: node_js
node_js:
  - '10'
addons:
  chrome: stable
```

### Run Lighthouse CI Script

To contain all the steps necessary for Lighthouse CI, we'll create a file located at `scripts/run-lighthouse-ci.sh` that should run as part of the build process. Make sure that this script is only run once per build or it will lead to confusing upload artifacts. For example, if you have a matrix build of several node versions, only run Lighthouse CI on one of them. In Travis, this translates to...

**.travis.yml**

```yaml
script:
  - npm run build # build your site
  - npm test # run normal tests
  - ./scripts/run-lighthouse-ci.sh # run lighthouse
```

**scripts/run-lighthouse-ci.sh**

```bash
#!/bin/bash

# example if only running lighthouse on node 10
if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then
  echo "Only run Lighthouse CI once per build, condititions did not match.";
  exit 0;
fi

# ...
```

#### Deploy Your Code

To run Lighthouse CI, the code you'd like to test with Lighthouse needs to be available on a server. You can either use a local development server or deploy to a public/intranet location. For this example, we'll assume your site is already built in a local directory called `./dist` and we'll use a local server.

```bash
#!/bin/bash

# ... (build condition check)

# Start a local development server to server our built site, can also use your
npx http-server -p 9000 ./dist &
# Wait for the server to start up
sleep 5

# ... (run lighthouse ci)

# Cleanup the development server when we're done
kill $!
```

#### Run Lighthouse CI

Now that we have our environment ready, time to run Lighthouse CI.

```bash
#!/bin/bash

# ... (build condition check)

# ... (server setup)

# Install Lighthouse CI
# If you're already using node to manage your project, add it to your package.json `devDependencies` instead to skip this step.
npm install -g @lhci/cli@next

# Collect Lighthouse reports for our URL
lhci collect --url=http://localhost:9000/index.html

# Assert that the reports look good, this step is configured in the next step.
lhci assert --preset="lighthouse:recommended"
EXIT_CODE=$?

# ... (kill server)

exit $EXIT_CODE
```

#### Completed Script

The complete script will look something like the below.

```bash
#!/bin/bash

if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then
  echo "Only run Lighthouse CI once per build, condititions did not match.";
  exit 0;
fi

npx http-server -p 9000 ./dist &
sleep 5

npm install -g @lhci/cli@next
lhci collect --url=http://localhost:9000/index.html
lhci assert --preset="lighthouse:recommended"
EXIT_CODE=$?

kill $!
exit $EXIT_CODE
```

### Configuration

The setup so far will automatically assert the Lighthouse team's recommended set of audits, but your project might have a bit of work to go before hitting straight 100s. Lucky for you the assertions are completely configurable! Read more about what's possible with [the assertions format](./assertions.md).

**lighthouserc.json**

```json
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

**scripts/run-lighthouse-ci.sh**

```bash
#!/bin/bash

# ...

# Change the assertion command to use our rc file.
lhci assert --rc-file=lighthouserc.json
EXIT_CODE=$?

# ...
```

## Extra Goodies

### Saving Reports to Public Storage

The existing setup will fail builds, print failing audits, and keep your project in line, but what happens when something goes wrong? You want to see the Lighthouse report!

There's a free service that provides temporary public storage of your Lighthouse reports so you can examine the HTML report of any build without tokens or extra infrastructure. Just add a single `lhci upload` command _after_ `lhci assert`.

**NOTE: as the name implies this is _temporary_ and _public_ storage, do not use if you're uncomfortable with the idea of your Lighthouse reports being stored on a public URL on Google Infrastructure. Reports are automatically deleted 7 days after upload.**

```bash
#!/bin/bash

# ...

lhci assert --rc-file=lighthouserc.json
EXIT_CODE=$?

lhci upload --target=temporary-public-storage

# ...
```

### Historical Reports & Diffing (Lighthouse CI Server)

Historical reports and advanced report diffing is available on the Lighthouse CI server. For setup of the server itself, see [our server documentation](./server.md). Once the server is setup, you can configure your Lighthouse CI integration to upload reports to it.

```bash
#!/bin/bash

# ...

lhci assert --rc-file=lighthouserc.json
EXIT_CODE=$?

lhci upload --serverBaseUrl="https://your-lhci-server-url.com" --token="$LHCI_SERVER_TOKEN"

# ...
```

### GitHub Status Checks

The existing setup will fail builds through your CI provider, but there's no differentiation between the build failing because of Lighthouse CI and the build failing for your other tests.

Lighthouse CI supports GitHub status checks that add additional granularity to your build reporting and direct links to uploaded reports.

![screenshot of GitHub status checks for Lighthouse CI](https://user-images.githubusercontent.com/2301202/66768920-64234f80-ee79-11e9-9dc0-0a6c85762078.png)

To enable GitHub status checks, [create a personal access token](https://github.com/settings/tokens/new) with the `repo:status` scope and [add it to your environment](https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-settings) as `LHCI_GITHUB_TOKEN`. The next time your `lhci upload` command runs it will also set the results as GitHub status checks!

![screenshot of GitHub personal access token creation form](https://user-images.githubusercontent.com/2301202/66769194-2246d900-ee7a-11e9-9d6c-2b6f78190a63.png)
