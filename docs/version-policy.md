# Version Policy

## Overview

LHCI follows semver on the 0.x.x track where breaking changes are not introduced in a patch version with the exception of critical security or stability patches. Because what constitutes a breaking change can be somewhat ambiguous, this document outlines what is considered a breaking change, the expected release cadence of breaking changes, and the responsibilities of the LHCI team in communicating breaking changes.

## Communication

When a breaking change has been introduced, the relevant commit will contain a line of the form `BREAKING CHANGE: brief description of the break`. These breaking change descriptions will be compiled into the release notes of the next release.

## Cadence

Breaking changes come from many sources within LHCI and have a much stricter definition than those in core Lighthouse. Accordingly, breaking change releases will be more frequent, but should also be less impactful on average. See the examples below for estimated frequency of each impact.

## Example Breaking Changes

| Change                                                    | Impact   | Expected Frequency |
| --------------------------------------------------------- | -------- | ------------------ |
| Lighthouse minor version bump that introduces a new audit | Low      | 3-6/year           |
| Lighthouse major version bump                             | Moderate | 1-2/year           |
| LHCI server API format change (removal of data)           | Moderate | 1-2/year           |
| LHCI server frontend URL format change                    | High     | 1-2/year           |
| Change in an assertion preset (stricter)                  | High     | 1-2/year           |
| Removal of a flag or option                               | High     | 1-2/year           |
| Change of the default value for a flag or option          | High     | 1-2/year           |

## Example Non-Breaking Changes

| Change                                           | Impact   | Expected Frequency |
| ------------------------------------------------ | -------- | ------------------ |
| Lighthouse minor version bump that fixes bugs    | Low      | 3-6/year           |
| Addition of a new flag or option                 | Low      | 2-4/year           |
| LHCI server API format change (addition of data) | Low      | 1-2/year           |
| LHCI server frontend design change               | Moderate | 1-2/year           |
| Change in an assertion preset (more lenient)     | Moderate | 1-2/year           |
| Fix of a critical security vulnerability         | High     | 0/year ;)          |
| Fix of a fatal startup bug                       | High     | 0/year ;)          |
