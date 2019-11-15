# Lighthouse CI

## Overview

Lighthouse CI is a set of commands that make continuously running, asserting, saving, and retrieving [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

- [Getting Started](./docs/getting-started.md)
- [Troubleshooting FAQs](./docs/troubleshooting.md)
- [CLI Documentation](./docs/cli.md)
- [Assertions Documentation](./docs/assertions.md)
- [Server Documentation](./docs/recipes/docker-server/README.md)
- [Versioning Policy](./docs/version-policy.md)

<img src="https://user-images.githubusercontent.com/39191/68522269-7917b680-025e-11ea-8d96-2774c0a0b04c.png"
alt="Screenshot of the Lighthouse CI server diff UI" width="75%">

## Quick Start

**.travis.yml**

```yaml
language: node_js
node_js:
  - 10 # use Node 10 LTS or later
before_install:
  - npm install -g @lhci/cli@0.3.x
script:
  - npm run build # build your site
  - lhci autorun # run lighthouse CI
addons:
  chrome: stable # make sure you have Chrome available
```

## Related Projects

- [Lighthouse CI GitHub Action](https://github.com/treosh/lighthouse-ci-action) - Automatically run Lighthouse CI on every PR with GitHub Actions, no infrastructure required.
