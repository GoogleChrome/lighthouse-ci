### This project is in **early alpha**. It is available for **testing only**.

### **Do not rely on this for production workloads.**

---

# Lighthouse CI

## Overview

Lighthouse CI is a set of commands that make running, asserting, saving, and retrieving [Lighthouse](https://github.com/GoogleChrome/lighthouse) results as easy as possible.

- [Getting Started](./docs/getting-started.md)
- [CLI Documentation](./docs/cli.md)
- [Assertions Documentation](./docs/assertions.md)
- [Server Documentation](./docs/recipes/docker-server/README.md)

## Quick Start

**.travis.yml**

```yaml
language: node_js
node_js:
  - 10 # use Node 10 LTS or later
before_install:
  - npm install -g @lhci/cli
script:
  - npm run build # build your site
  - lhci autorun # run lighthouse CI
addons:
  chrome: stable # make sure you have Chrome available
```
