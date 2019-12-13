# Lighthouse CI

## Overview

Lighthouse CI is a set of commands that make continuously running, asserting, saving, and retrieving [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

The node CLI (`npm install -g @lhci/cli`) runs Lighthouse, asserts results, and uploads reports.

The node server (`npm install @lhci/server`) stores results, compares reports, and displays historical results with a dashboard UI.

### Use Cases

- Get a Lighthouse report alongside every PR.
- Prevent regressions in accessibility, SEO, offline support, and performance best practices.
- Track performance metrics and Lighthouse scores over time.
- Set and keep performance budgets on scripts and images.
- Run Lighthouse many times to reduce variance.
- Compare two versions of your site to find improvements and regressions of individual resources.

<img src="https://user-images.githubusercontent.com/2301202/70814696-a4c41a00-1d91-11ea-9ed9-77811939c244.png"
alt="Screenshot of the Lighthouse CI github app UI" width="48%"> <img src="https://user-images.githubusercontent.com/2301202/70814463-29626880-1d91-11ea-9d82-6483033919cf.png"
alt="Screenshot of the Lighthouse CI server dashboard UI" width="48%">
<img src="https://user-images.githubusercontent.com/2301202/70814842-ef459680-1d91-11ea-8b55-bb5d44eeb969.png"
alt="Screenshot of the Lighthouse CI github app UI" width="48%"> <img src="https://user-images.githubusercontent.com/2301202/70814650-85c58800-1d91-11ea-925e-af9d03f1b20d.png"
alt="Screenshot of the Lighthouse CI server diff UI" width="48%">

### Documentation

- [Getting Started](./docs/getting-started.md)
- [Troubleshooting / FAQs](./docs/troubleshooting.md)
- [CLI Documentation](./docs/cli.md)
- [Assertions Documentation](./docs/assertions.md)
- [Server Documentation](./docs/recipes/docker-server/README.md)
- [Versioning Policy](./docs/version-policy.md)

### Quick Start

**.travis.yml**

```yaml
language: node_js
addons:
  chrome: stable
before_install:
  - npm install -g @lhci/cli@0.3.x
script:
  - npm run build # build your site
  - lhci autorun # run lighthouse CI
```

## Related Projects

- [Lighthouse CI GitHub Action](https://github.com/treosh/lighthouse-ci-action) - Automatically run Lighthouse CI on every PR with GitHub Actions, no infrastructure required.

- [Lighthouse CI Starter Example](https://github.com/hchiam/learning-lighthouse-ci) - A minimal example repo that you can use as a template when starting from scratch, offers a beginner-friendly quickstart guide using create-react-app.

## Community Guides

A collection of unofficial blog posts, tutorials, and guides written by the community on using Lighthouse CI.

**NOTE:** This is not official documentation. You're encouraged to familiarize yourself with Lighthouse CI and read through [Getting Started](./docs/getting-started.md) before continuing.

- [Integerate Lighthouse CI for static website generator](https://blog.akansh.com/integrate-lighthouse-ci-with-static-site-generators/) - An article on integrating Lighthouse CI with static website generators like Gatsby, Jekyll, etc.
