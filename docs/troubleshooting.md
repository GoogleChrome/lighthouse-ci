# Troubleshooting / FAQs

## I can't get it working with my CI provider. Help!

First, make sure you're using `lhci autorun` or invoking `lhci healthcheck --fatal` in your script. Check the output logs of the healthcheck for anything that's failing and try resolving those problems first using the guide below before filing an issue.

## My page is behind a login. How do I get Lighthouse CI to run on the real app?

You have a couple of options to teach Lighthouse CI how to login to your page.

- [`--collect.puppeteerScript`](./configuration.md#puppeteerscript)
- [Configure Custom Headers](./configuration.md#page-behind-authentication)
- [Other Lighthouse Auth Methods](https://github.com/GoogleChrome/lighthouse/blob/v5.6.0/docs/authenticated-pages.md)

## Lighthouse is failing to run. How do I fix it?

Checkout the [issues in Lighthouse](https://github.com/GoogleChrome/lighthouse/issues) to see if someone else has run into the same problem before (Hint: _closed_ issues often have solutions that you might find useful too!). Here are some of the most common problems we see...

- **Missing Chrome**: You don't have Chrome available on your machine. Follow the examples in the [getting started guide](./getting-started.md#collect-lighthouse-results) to add Chrome to your CI provider. Follow the Jenkins setup section if you're running in a custom environment.
- **Protocol Error: X.Y wasn't found**: Your version of Chrome is incompatible with the Lighthouse version, latest Lighthouse CI supports stable Chrome and later. This is especially common when used in combination with Puppeteer, try updating your `puppeteer` version first, or follow the examples in the [getting started guide](./getting-started.md#collect-lighthouse-results) to add Chrome to your CI provider.
- **No usable sandbox**: Your OS wasn't configured to support Chrome process sandboxing, try [creating a Chrome usergroup](https://github.com/GoogleChromeLabs/lighthousebot/blob/a4bfc0857741c1cd6bde9ded967971fd27254ed6/builder/Dockerfile#L35-L40) or running with `--collect.settings.chromeFlags="--no-sandbox"`. If running in a docker container, ensure the container has [SYS_ADMIN privileges](./recipes/docker-client/README.md#--no-sandbox-issues-explained).

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

When using this option, you'll lose the default `:PORT` and `UUID` replacements, so be sure to copy those into your configuration if necessary. [See the example in the lighthuose-ci repo itself](https://github.com/GoogleChrome/lighthouse-ci/blob/5485be50406f7b600b679bd447b493b6544b2682/lighthouserc.json#L32-L36) for how to configure these patterns.

## I'm seeing differences in the results even though I didn't change anything.

Webpages are fickle beasts and variance is a common problem when measuring properties of pages in a real browser as Lighthouse does. The Lighthouse team has [several](https://github.com/GoogleChrome/lighthouse/blob/v6.4.1/docs/variability.md) good [documents](https://docs.google.com/document/d/1AujmeKvBhzr-d8IsB7zPeS-vOtxCdw2GnspKpxJ7d_I/edit) on the [subject](https://docs.google.com/document/d/1BqtL-nG53rxWOI5RO0pItSRPowZVnYJ_gBEQCJ5EeUE/edit?usp=sharing), but the tl;dr is...

- Run many times (LHCI runs 3 by default, use the `--collect.numberOfRuns=X` option to increase this).
- Use reliable hardware (avoid underpowered CI systems like Appveyor and burstable instances, use dedicate machines with a minimum of 2 cores and 4GB of RAM).
- Eliminate non-determinism (remove random `setTimeout` calls, A/B tests, etc).
- Avoid external dependencies (disable variable third-party integrations like ads, YouTube embeds, analytics, etc).
- Assert facts over conclusions (start with assertions on the number and size of your JavaScript requests rather than the value of TTI).

## The results I'm seeing don't match the results I see in another environment.

Different environments and ways of running Lighthouse will tend to see different results for the same underlying reasons described in the above FAQ on variance (see the [several](https://github.com/GoogleChrome/lighthouse/blob/v6.4.1/docs/variability.md) good [documents](https://docs.google.com/document/d/1AujmeKvBhzr-d8IsB7zPeS-vOtxCdw2GnspKpxJ7d_I/edit) on the [subject](https://docs.google.com/document/d/1BqtL-nG53rxWOI5RO0pItSRPowZVnYJ_gBEQCJ5EeUE/edit?usp=sharing)). Before resorting to variance isolation though, first double check that the different environments are actually being run with the same Lighthouse settings. The most common differences we see that folks might forget to consider...

- Device form factor
- Throttling settings (hint: desktop in Chrome DevTools/PSI doesn't *only* change the form factor, it [changes throttling too](https://github.com/GoogleChrome/lighthouse/blob/v6.4.1/lighthouse-core/config/lr-desktop-config.js))
- Storage clearing settings
- Login/Authentication state
- Headless vs. headful Chrome
- Hardware quality (free CI providers tend to have very underpowered CPUs)
- Geographic location

The team does not have the bandwidth to assist with debugging this problem. Please do _not_ file an issue about it if you're unable to get scores from different environments to match.

## Running LHCI in Github Actions I constantly get Ancestor hash not determinable

If you are using `actions/checkout@v3` to checkout your repository and based on the size and traffic on your repo this error might happen due to how the checkout action is configured and is not a LHCI issue.

Checkout action by default doesn't clone the entire repo and the number of commits to fetch is set to 1 for performance reasons. When LHCI runs the health check the ancestor hash might be missing because the branch / hash is not there in the local history.

In order to fix it change / add the following:

```yml
name: Run Lighthouse tests
jobs:
  lhci:
    name: Lighthouse
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 20
      - name: Fetch base_ref HEAD to use it as Ancestor hash in LHCI
        run: git fetch --depth=1 origin +refs/heads/${{github.base_ref}}:refs/remotes/origin/${{github.base_ref}}
```

The additions are `fetch-depth: 20` added to `actions/checkout@v3` and a new step to fetch base_ref HEAD to use it as ancestor hash in LHCI.

The fetch depth set to 20 is a good default, but might not work in all cases, you can adjust it based on your needs.
