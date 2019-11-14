# Getting Started

This guide will walk you through how to setup Lighthouse CI on your repository.

Estimated Time: ~15 minutes

## Prerequisites

Your project should meet the following requirements:

1. Source code is managed with git (GitHub, GitLab, Bitbucket, etc).
2. Branches/pull requests are gated on the results of a continuous integration build process (Travis CI, CircleCI, Azure Pipelines, AppVeyor, GitHub Actions, etc).
3. Your CI process can build your project into production assets (typically provided as an `npm run build` command by most frameworks).
4. Your project either:
   A) has a command that runs a web server with production-like assets.
   B) is a static site.

In the examples that follow, use of GitHub and Travis CI are assumed but the same concepts apply to other providers. Refer to your specific provider's documentation for how to accomplish each setup step.

## Quick Start

Lighthouse CI comes with an automatic pipeline, called `autorun`, that should work for many web projects. If you have any complicated moving parts, `autorun` might not work for you. Read up on the details in [the full setup guide](#setup).

**.travis.yml**

```yaml
# xenial (the default) or newer required
language: node_js
node_js:
  - 10 # Node 10 LTS or later required
addons:
  chrome: stable # make sure to have Chrome available
before_install:
  - npm install -g @lhci/cli@0.3.x # install LHCI
script:
  - npm run build # build your site
  - npm test # run your normal tests
  - lhci autorun # run lighthouse CI against your static site
```


<details>
<summary>Github Actions</summary>
<br />
   
```yaml
name: Build project + run Lighthouse CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [10.x]

    steps:
    - uses: actions/checkout@v1
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - name: npm install, build
      run: |
        npm install
        npm run build
      run: |
          npm install -g @lhci/cli@0.3.x
          lhci autorun --config=./lighthouse/lighthouserc.json
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

```
</details>

That's it! With this in place, you'll have Lighthouse reports collected and and asserted.

See the [autorun docs](./cli.md#autorun) for more including running your own webserver and uploading the reports for later viewing.

You can also run a [Lighthouse CI server](#the-lighthouse-ci-server) for report diffs and timeseries charts. Or alternatively, just [upload the reports](#saving-reports-to-temporary-public-storage) for easy viewing. [GitHub Status checks](#github-status-checks) can also be enabled easily.

## Complete Setup

A Lighthouse CI run will roughly follow these steps.

1. Setup CI environment.
2. Serve your site locally or deploy to a development server.
3. Collect Lighthouse results with Lighthouse CI.
4. Assert that the results meet your expectations.
5. (Optional) Upload the results for helpful debugging and historical analysis. (See [Storing Reports](#storing-reports))

The complete script might look something like the below, but read on for the breakdown and explanations.

```bash
#!/bin/bash

# NOTE: This step only required for matrix builds, see "Create a run-lhci script" for more details.
if [[ "$TRAVIS_NODE_VERSION" != "10" ]]; then
  echo "Only run Lighthouse CI once per build, node version is not the selected version.";
  exit 0;
fi

npm run deploy

npm install -g @lhci/cli@0.3.x
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

To contain all the steps necessary for Lighthouse CI, we'll create a file located at `scripts/run-lhci.sh` that should run as part of the build process. In Travis, this translates to...

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
npm install -g @lhci/cli@0.3.x

# Run a healthcheck to make sure everything looks good before we run collection.
lhci healthcheck --fatal

# Collect Lighthouse reports for our URL.
lhci collect --url=http://localhost:9000/index.html

# Assert that the reports look good, this step is configured in the next step.
lhci assert --preset="lighthouse:recommended"
EXIT_CODE=$?

# ... (kill server)

exit $EXIT_CODE
```

### Configuration

The setup so far will automatically assert the Lighthouse team's recommended set of audits, but your project might have a bit of work to go before hitting straight 100s! Lucky for you the assertions are completely configurable! Read more about what's possible with [the assertions format](./assertions.md).

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

```bash
lhci assert --config=lighthouserc.json
EXIT_CODE=$?
```

## Storing Reports

You have two options for storing the collected Lighthouse reports for later viewing.

### Saving Reports to Temporary Public Storage

While the Lighthouse CI server offers the complete LHCI experience, you do have to host it yourself. If you'd like basic storage so you can just get a URL for each report, we offer a free service that provides temporary public storage.

**NOTE: as the name implies this is _temporary_ and _public_ storage, do not use if you're uncomfortable with the idea of your Lighthouse reports being stored on a public URL on Google Cloud infrastructure. Reports are automatically deleted 7 days after upload.**

```bash
# If you use `lhci assert`, upload must follow after it.
lhci upload --target=temporary-public-storage
```

If you're using `autorun`, setting `ci.upload.target` to `temporary-public-storage` in your `lighthouserc.json` is all that's necessary. The upload step will happen automatically.

### The Lighthouse CI Server

<img src="https://user-images.githubusercontent.com/39191/68522781-496bad00-0264-11ea-800a-ed86dbb04366.png" width="48%"> <img src="https://user-images.githubusercontent.com/39191/68522269-7917b680-025e-11ea-8d96-2774c0a0b04c.png" width="48%">

Historical reports and advanced report diffing is available with the Lighthouse CI server. For setup of the server itself, see [our server recipe](./recipes/docker-server/README.md).

Once the server is set up, create a a new project with the lhci wizard:

```bash
$ lhci wizard
? Which wizard do you want to run? new-project
? What is the URL of your LHCI server? https://your-lhci-server.example.com/
? What would you like to name the project? My Favorite Project
? Where is the project's code hosted? https://github.com/GoogleChrome/lighthouse-ci

Created project My Favorite Project (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)!
Use token XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX to connect.
```

Add your token to your CI with the environment variable `LHCI_TOKEN`. Alternatively, you can pass it to `upload` with the `--token` flag:

```
lhci upload --serverBaseUrl="https://your-lhci-server-url.com" --token="$LHCI_SERVER_TOKEN"
```

Note that this token is only semi-secret. Anyone with HTTP access to the server will already be able to view and create data on the server as it is unauthenticated but by masking the token.

## GitHub Status Checks

The setup so far will fail builds through your CI provider, but there's no differentiation between the build failing because of Lighthouse CI versus your other tests.

Lighthouse CI supports GitHub status checks that add additional granularity to your build reporting and direct links to uploaded reports.

![screenshot of GitHub status checks for Lighthouse CI](https://user-images.githubusercontent.com/2301202/68001177-0b9dd180-fc31-11e9-8091-ada8c6e50a9b.png)

#### GitHub App Method (Recommended)

To enable GitHub status checks via the official GitHub app, [install and authorize the app](https://github.com/apps/lighthouse-ci) with the owner of the target repo. If the repo is within an organization, organization approval might be necessary. Copy the token provided on the authorization confirmation page and [add it to your build environment](https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-settings) as `LHCI_GITHUB_APP_TOKEN`. The next time your `lhci upload` command runs it will also set the results as GitHub status checks!

Be sure to keep this token secret. Anyone in possession of this token will be able to set status checks on your repository.

#### Alternative: Personal Access Token Method

If you don't want to use the Github App, you can enable this via a personal access token. The only difference is that your user account (and its avatar) will post a status check. [Create a token](https://github.com/settings/tokens/new) with the `repo:status` scope and [add it to your environment](https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-settings) as `LHCI_GITHUB_TOKEN`.

Be sure to keep this token secret. Anyone in possession of this token will be able to set status checks on your repository.
