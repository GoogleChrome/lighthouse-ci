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
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
      - run: npm install && npm install -g @lhci/cli@0.4.x
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

## Community Guides

A collection of unofficial blog posts, tutorials, and guides written by the community on using Lighthouse CI. If you've written up a guide to using Lighthouse CI in your project, open a PR to add it here!

**NOTE:** This is not official documentation. You're encouraged to familiarize yourself with Lighthouse CI and read through [Getting Started](./docs/getting-started.md) before continuing.

- [Integrate Lighthouse CI for static website generator](https://blog.akansh.com/integrate-lighthouse-ci-with-static-site-generators/) - An article on integrating Lighthouse CI with static website generators like Gatsby, Jekyll, etc.

## Contributing

We welcome contributions to lighthouse-ci! Read our [contributing guide](./CONTRIBUTING.md) to get started.
