# Migration Guide

## Overview

This documents provides guidance on upgrading your LHCI version both in CLI and the server.

### Patch Updates

Patch version updates typically require no specific action on the user's part (see [the version policy](./version-policy.md) for details). If any SQL migrations are needed for new features, the server will automatically execute them on startup.

### Server-CLI Version Compatibility

LHCI commits to ensuring that the CLI of version `n` will always be compatible with the server of version `n - 1`. This ensures that smooth migrations between versions proceed by first updating your `@lhci/cli` dependencies followed by updating the server to match. The reverse statement is not true. Upgrading the server before upgrading clients may result in lost data.

## `0.3.0` to `0.4.0`

### Affected Usage Patterns

- `staticDistDir` usage without explicit `url` (new autodetection logic, different URLs could be collected)
- `lighthouse:*` assertion preset usage (new audits asserted, assertions could fail)
- `assert` usage (some audits removed and scores changed, assertions could fail)
- Custom LHCI server API usage (new headers required and statistic names changed, API calls could fail)
- Custom `.lighthouseci/` folder usage (HTML reports deleted on every `collect` invocation, data could be lost)

If your use of Lighthouse CI doesn't follow any of these patterns, you will likely see no breaking changes.

### Breaking Changes

- build statistics use `_median` suffix not `_average`
- category scores changed to lighthouse 6.0 weighting
- collect will now recurse into subdirectories when no URLs are provided to collect and a `staticDistDir` is given
- default assertion will now be minScore=0.9
- HTML reports in .lighthouseci/ will also be deleted on running of `collect`, not just the JSON
- presets now assert lighthouse 6.0 audits
- x-lhci-build-token header now required on POST /projects/:id/builds
- x-lhci-build-token header now required on POST /projects/:id/builds/:id:/runs and PUT /projects/:id/builds/:id/lifecycle
