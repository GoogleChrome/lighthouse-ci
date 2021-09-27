#!/bin/bash

set -euxo pipefail

# Create a git repo for us to test.
mkdir /tmp/lhci_client_test
cd /tmp/lhci_client_test
git init
touch README.md
git add README.md
git config --global user.email "lhci@example.com"
git config --global user.name "Robot Lighthouse"
git commit -m 'initial commit'

# Run our LHCI commands
which lhci
lhci healthcheck
lhci collect --url=https://example.com -n=1 --settings.chromeFlags="--no-sandbox --disable-dev-shm-usage"
lhci upload --target=filesystem
