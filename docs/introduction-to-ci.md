# Introduction to CI

## Overview

**If you're already familiar with CI and have it configured on your project already, move on to [Getting Started](./getting-started.md).**

Lighthouse CI provides added value to your continuous integration (CI) process. If you're unfamiliar with continuous integration or haven't set it up on a project before, this document will define a few key concepts and provide references on how to getting started with various CI providers.

## Concepts

### CI - Continuous Integration

> a software development practice where members of a team <strong>integrate their work frequently</strong>, usually each person integrates at least daily - leading to multiple integrations per day. Each <strong>integration is verified by an automated build (including tests)</strong> to detect integration errors as quickly as possible.<br /><br />- Martin Fowler

Continuous integration is about making small, frequent changes to a codebase and automatically testing those changes to ensure you always have a working build. Lighthouse CI helps make Lighthouse a part of the automated testing process.

### CD - Continuous Delivery

> Continuous Delivery is a software development discipline where you build software in such a way that the software can be released to production at any time.<br /><br />- Martin Fowler

A closely related practice to continuous integration. By running Lighthouse within your continuous integration process, you can more confidently release to production.

### CI Provider

A vendor that provides hosted services and version control integrations to facilitate automated testing for continuous integration.

## Setting Up CI

There are many CI providers out there to choose from. Lighthouse CI works with any provider that offers a stable environment with Node 10 LTS or later and stable Chrome. Below are some common providers documentation on how to get started.

- [GitHub Actions](https://help.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow)
- [GitLab CI](https://docs.gitlab.com/ee/ci/quick_start/)
- [Travis CI](https://docs.travis-ci.com/user/tutorial/)
- [Circle CI](https://circleci.com/docs/2.0/getting-started/)
