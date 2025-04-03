# Ground News Lighthouse CI

This is a fork of GoogleChrome/lighthouse, mainly for use as a placeholder repo link in Flightcontrol (FC),
and as a knowledge dump of how we got this running in Flightcontrol. The original README content will follow.

## Deployment

The `patrickhulce/lhci-server` image from Dockerhub is deployed in the
[Lighthouse CI project on Flightcontrol](https://app.flightcontrol.dev/org/clxvxf2r50006w1rx4irpv41g/environments/cm91h7j21000fkhpsjqpeumze)
project. Persistent storage is provided by a Postgres RDS database, also provisioned through Flightcontrol.

### Postgres SSL Gotcha

Flightcontrol automatically creates a Postgres user on RDS databases and exposes the connection string
through the dashboard. However, the user is only permitted to connect using SSL, and the database's
certificate is self-signed, so `?sslmode=no-verify` must be added to the connection string in order for
the server to connect successfully. Linking the connection string from the FC database service directly
to the LHCI FC service will not work.

The LHCI server uses Sequelize v4 under the hood, and `yargs` to translate environment variables into
the Sequelize connection object.

More information here: 
- [Lighthouse CI connection configuration docs](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#environment-variables)
- https://node-postgres.com/features/ssl#usage-with-connectionstring
- [Illustrative Github issue I commented on](https://github.com/GoogleChrome/lighthouse-ci/issues/955)

### The required environment variables set on the FC project

```env
LHCI_STORAGE__SQL_DIALECT=postgres
LHCI_STORAGE__SQL_CONNECTION_URL=postgres://<connection-string>?sslmode=no-verify
```

### Other FC details

#### Cloudfront

The LHCI FC service is designated as a "Web server," so it has a Cloudfront distribution.
The distribution is set to the NA/EU price class for a bit of savings, and caching is disabled.

### Bootstrapping

The original setup docs have you globally install `@lhci/cli` in order to create the first project.
If you want to avoid that, you can just run `npm ci` in this directory and it will be installed locally.
This only needs to be done again if a new project is needed.

The ground-web project has been created and its build and admin tokens added as environment variables on the
LHCI FC project itself, for reference.

Original setup docs here:
https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md#project-creation


#### The original README content follows.

# Lighthouse CI

## Overview

Lighthouse CI is a suite of tools that make continuously running, saving, retrieving, and asserting against [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

### Quick Start

To get started with GitHub actions for common project configurations, add the following file to your GitHub repository. Follow [the Getting Started guide](./docs/getting-started.md) for a more complete walkthrough and instructions on other providers and setups.

**.github/workflows/ci.yml**

```yaml
name: CI
on: [push]
jobs:
  lighthouseci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install && npm install -g @lhci/cli@0.14.x
      - run: npm run build
      - run: lhci autorun
```

### Features

- Get a Lighthouse report alongside every PR.
- Prevent regressions in accessibility, SEO, offline support, and performance best practices.
- Track performance metrics and Lighthouse scores over time.
- Set and keep performance budgets on scripts and images.
- Run Lighthouse many times to reduce variance.
- Compare two versions of your site to find improvements and regressions of individual resources.

<img src="https://user-images.githubusercontent.com/2301202/70814696-a4c41a00-1d91-11ea-9ed9-77811939c244.png"
alt="Screenshot of the Lighthouse CI github app UI" width="48.5%"> <img src="https://user-images.githubusercontent.com/2301202/79480502-c8af9a80-7fd3-11ea-8087-52f6c8ba6f03.png"
alt="Screenshot of the Lighthouse CI server dashboard UI" width="47%">
<img src="https://user-images.githubusercontent.com/2301202/70814842-ef459680-1d91-11ea-8b55-bb5d44eeb969.png"
alt="Screenshot of the Lighthouse CI assertion output" width="48%"> <img src="https://user-images.githubusercontent.com/2301202/70814650-85c58800-1d91-11ea-925e-af9d03f1b20d.png"
alt="Screenshot of the Lighthouse CI server diff UI" width="48%">

### Documentation

If you're already familiar with continuous integration and have an existing process, start with [Getting Started](./docs/getting-started.md).

If you're _not_ familiar with continuous integration, start with [Introduction to CI](./docs/introduction-to-ci.md).

- [Introduction to CI](./docs/introduction-to-ci.md)
- [Getting Started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Troubleshooting / FAQs](./docs/troubleshooting.md)
- [Configuration](./docs/configuration.md)
- [Server](./docs/server.md)
- [Versioning Policy](./docs/version-policy.md)

## Related Community Projects

A collection of projects using Lighthouse CI written by the community. If you're using Lighthouse CI in your open source project, open a PR to add it here!

- [Lighthouse CI GitHub Action](https://github.com/treosh/lighthouse-ci-action) - Automatically run Lighthouse CI on every PR with GitHub Actions, no infrastructure required.

- [Lighthouse CI Starter Example](https://github.com/hchiam/learning-lighthouse-ci) - A minimal example repo that you can use as a template when starting from scratch, offers a beginner-friendly quickstart guide using create-react-app.

- [Lighthouse CI Compare Action](https://github.com/adevinta/actions-lighthouseci-compare) - A Lighthouse CI Github Action that compares the current commit run against the ancestor commit and creates an object with the differences and a Markdown table that you can use for different purposes.

## Community Guides

A collection of unofficial blog posts, tutorials, and guides written by the community on using Lighthouse CI. If you've written up a guide to using Lighthouse CI in your project, open a PR to add it here!

**NOTE:** This is not official documentation. You're encouraged to familiarize yourself with Lighthouse CI and read through [Getting Started](./docs/getting-started.md) before continuing.

- [Integrate Lighthouse CI for static website generator](https://blog.akansh.com/integrate-lighthouse-ci-with-static-site-generators/) - An article on integrating Lighthouse CI with static website generators like Gatsby, Jekyll, etc.
- [Automating Google Lighthouse audits and uploading results to Azure](https://keepinguptodate.com/pages/2021/07/automating-google-lighthouse-upload-to-azure/) - This article covers configuring Lighthouse CI to run against a website and uploading the results to a Lighthouse CI server Docker container running both locally and in Azure.

## Contributing

We welcome contributions to lighthouse-ci! Read our [contributing guide](./CONTRIBUTING.md) to get started.
