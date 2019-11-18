# Troubleshooting FAQs

## I can't get it working with my CI provider. Help!

First, make sure you're using `lhci autorun` or invoking `lhci healthcheck --fatal` in your script. Check the output logs of the healthcheck for anything that's failing and try resolving those problems first using the guide below before filing an issue.

## The GitHub App/LHCI server upload isn't working on PRs from external contributors.

Most CI systems prevent secrets from leaking into the environment of untrusted pull requests from forks. This is a helpful security measure to prevent privileged information from falling into malicious hands.

If your LHCI server is already publicly accessible and you don't mind allowing contributors to potentially spam data into it, then you can safely make the `LHCI_TOKEN` public as well. It is an additive-write-only credential that cannot destroy historical data.

## I lost the LHCI_GITHUB_APP_TOKEN. How do I get it back?

While it's not possible retrieve a lost GitHub App token, you can uninstall and [reinstall the app](https://github.com/apps/lighthouse-ci) to get a fresh token.

## LHCI server isn't finding the correct base branch ancestor.

Some CI systems download a shallow copy of the repository to improve cloning time, but this prevents contextual information like the shared base ancestor commit from being picked up by Lighthouse CI. Ensure you configure your provider's git depth to a value large enough to cover most of your feature branches.

**.travis.yml**

```yaml
git:
  #### Example: clone with the past 20 commits ######
  depth: 20
  #### Example: disable git depth entirely ######
  depth: false
```

## LHCI server won't let me upload a rerun of a build.

This is a precautionary measure to prevent the effective deletion of historical data from the server. As workaround, you can create empty commits to rerun builds `git commit --allow-empty -m 'rerun CI' && git push`.

## My URLs change between builds and LHCI server can't link them.

If the URLs that you audit contain random components (ports, UUIDs, hashes, etc), then you'll need to tell LHCI how to normalize your data when you upload it with the `--url-replacement-patterns` option.

When using this option, you'll lose the default `:PORT` and `UUID` replacements, so be sure to copy those into your configuration if necessary. [See the example in the lighthuose-ci repo itself](https://github.com/GoogleChrome/lighthouse-ci/blob/v0.3.0-alpha.0/lighthouserc.json) for how to configure these patterns.

## I'm seeing differences in the results even though I didn't change anything.

Webpages are fickle beasts and variance is a common problem when measuring properties of pages in a real browser as Lighthouse does. The Lighthouse team has [several](https://github.com/GoogleChrome/lighthouse/blob/v5.0.0/docs/variability.md) good [documents](https://docs.google.com/document/d/1AujmeKvBhzr-d8IsB7zPeS-vOtxCdw2GnspKpxJ7d_I/edit) on the [subject](https://docs.google.com/document/d/1BqtL-nG53rxWOI5RO0pItSRPowZVnYJ_gBEQCJ5EeUE/edit?usp=sharing), but the tl;dr is...

- Run many times (LHCI runs 3 by default, use the `--collect.numberOfRuns=X` option to increase this).
- Use reliable hardware (avoid underpowered CI systems like Appveyor and burstable instances, use dedicate machines with a minimum of 2 cores and 4GB of RAM).
- Eliminate non-determinism (remove random `setTimeout` calls, A/B tests, etc).
- Avoid external dependencies (disable variable third-party integrations like ads, YouTube embeds, analytics, etc).
- Assert facts over conclusions (start with assertions on the number and size of your JavaScript requests rather than the value of TTI).
